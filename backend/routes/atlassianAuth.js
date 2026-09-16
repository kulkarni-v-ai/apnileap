/**
 * Atlassian OAuth 2.0 (3LO) & Integration Express Routes
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const oauthService = require('../services/atlassian/AtlassianOAuthService');
const tokenService = require('../services/atlassian/AtlassianTokenService');
const config = require('../config/env');

const prisma = new PrismaClient();
const stateStore = new Map(); // Short-lived state store for CSRF protection

/**
 * GET /api/integrations/atlassian
 * Get current active Atlassian connection details
 */
router.get('/', async (req, res) => {
  try {
    const connection = await prisma.atlassianConnection.findFirst({
      orderBy: { updatedAt: 'desc' },
      include: { resources: true }
    });

    if (!connection) {
      return res.json({ connected: false, message: 'No Atlassian account connected.' });
    }

    res.json({
      connected: connection.status === 'CONNECTED',
      status: connection.status,
      connectionId: connection.id,
      siteName: connection.siteName,
      siteUrl: connection.siteUrl,
      cloudId: connection.cloudId,
      scopes: connection.scopes,
      lastValidatedAt: connection.lastValidatedAt,
      lastRefreshAt: connection.lastRefreshAt,
      resources: connection.resources
    });
  } catch (error) {
    console.error('Error fetching Atlassian connection:', error);
    res.status(500).json({ code: 'DATABASE_ERROR', message: error.message });
  }
});

/**
 * GET /api/integrations/atlassian/authorize
 * Redirects user to Atlassian authorization consent screen
 */
router.get('/authorize', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  stateStore.set(state, { createdAt: Date.now(), userId: req.user?.id || null });

  // Clean up state after 10 minutes
  setTimeout(() => stateStore.delete(state), 10 * 60 * 1000);

  const authUrl = oauthService.getAuthorizeUrl(state);
  res.redirect(authUrl);
});

/**
 * GET /api/integrations/atlassian/callback
 * Handles OAuth callback code exchange & cloud ID discovery
 */
router.get('/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    console.error('Atlassian OAuth Error:', error, error_description);
    return res.redirect(`${config.FRONTEND_URL}/settings?integration_error=${encodeURIComponent(error_description || error)}`);
  }

  if (!code || !state || !stateStore.has(state)) {
    return res.status(400).json({ code: 'INVALID_OAUTH_STATE', message: 'Invalid or expired state parameter.' });
  }

  stateStore.delete(state);

  try {
    // 1. Exchange authorization code for tokens
    const tokenData = await oauthService.exchangeCodeForTokens(code);

    // 2. Fetch accessible resources (cloud IDs)
    const resources = await oauthService.getAccessibleResources(tokenData.accessToken);

    if (!resources || resources.length === 0) {
      return res.redirect(`${config.FRONTEND_URL}/settings?integration_error=NO_ACCESSIBLE_JIRA_SITES`);
    }

    // Pick primary site resource
    const primaryResource = resources[0];

    // 3. Save connection and resources in PostgreSQL
    const connection = await tokenService.saveConnection({
      cloudId: primaryResource.cloudId,
      siteName: primaryResource.siteName,
      siteUrl: primaryResource.siteUrl,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresIn: tokenData.expiresIn,
      scopes: tokenData.scope
    });

    // Save all accessible resources
    await prisma.atlassianResource.deleteMany({ where: { connectionId: connection.id } });
    for (const r of resources) {
      await prisma.atlassianResource.create({
        data: {
          connectionId: connection.id,
          cloudId: r.cloudId,
          siteName: r.siteName,
          siteUrl: r.siteUrl,
          avatarUrl: r.avatarUrl,
          scopes: r.scopes
        }
      });
    }

    console.log(`Successfully connected Atlassian site: ${primaryResource.siteName} (${primaryResource.cloudId})`);
    res.redirect(`${config.FRONTEND_URL}/settings?atlassian_connected=true`);
  } catch (err) {
    console.error('Callback Handler Failed:', err);
    res.redirect(`${config.FRONTEND_URL}/settings?integration_error=${encodeURIComponent(err.message)}`);
  }
});

/**
 * POST /api/integrations/atlassian/validate
 * Validates current token & connection state
 */
router.post('/validate', async (req, res) => {
  try {
    const tokenInfo = await tokenService.getValidAccessToken();
    res.json({
      valid: true,
      cloudId: tokenInfo.cloudId,
      message: 'Atlassian connection validated successfully.'
    });
  } catch (error) {
    res.status(400).json({
      valid: false,
      code: error.message.split(':')[0],
      message: error.message
    });
  }
});

/**
 * POST /api/integrations/atlassian/refresh
 * Forces token refresh
 */
router.post('/refresh', async (req, res) => {
  try {
    const connection = await prisma.atlassianConnection.findFirst({ where: { status: 'CONNECTED' } });
    if (!connection) {
      return res.status(404).json({ code: 'ATLASSIAN_NOT_CONNECTED', message: 'No connection to refresh.' });
    }
    const tokenInfo = await tokenService.getValidAccessToken(connection.id);
    res.json({ success: true, message: 'Token refreshed successfully.', cloudId: tokenInfo.cloudId });
  } catch (error) {
    res.status(500).json({ code: 'REFRESH_FAILED', message: error.message });
  }
});

/**
 * DELETE /api/integrations/atlassian/:connectionId
 * Disconnects an Atlassian account
 */
router.delete('/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;
    await prisma.atlassianConnection.delete({ where: { id: connectionId } });
    res.json({ success: true, message: 'Atlassian connection removed.' });
  } catch (error) {
    res.status(500).json({ code: 'DISCONNECT_FAILED', message: error.message });
  }
});

module.exports = router;
