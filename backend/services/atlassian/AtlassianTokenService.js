/**
 * Atlassian Centralized Token Service
 * Manages token lifecycle, decryption, and automatic rotating refresh.
 */
const { PrismaClient } = require('@prisma/client');
const { encryptToken, decryptToken } = require('./tokenCrypto');
const oauthService = require('./AtlassianOAuthService');

const prisma = new PrismaClient();
const EXPIRATION_BUFFER_MS = 5 * 60 * 1000; // 5 minutes buffer

class AtlassianTokenService {
  /**
   * Retrieves a valid decrypted Access Token for a given cloudId or connectionId.
   * Auto-refreshes token if expired or near expiration.
   */
  async getValidAccessToken(cloudIdOrConnectionId) {
    let connection = await prisma.atlassianConnection.findFirst({
      where: {
        OR: [
          { id: cloudIdOrConnectionId },
          { cloudId: cloudIdOrConnectionId }
        ]
      }
    });

    if (!connection) {
      // Fallback: If no connectionId passed, pick the first active connection
      connection = await prisma.atlassianConnection.findFirst({
        where: { status: 'CONNECTED' },
        orderBy: { updatedAt: 'desc' }
      });
    }

    if (!connection) {
      throw new Error('ATLASSIAN_NOT_CONNECTED: No Atlassian connection found.');
    }

    if (connection.status === 'REAUTH_REQUIRED' || connection.status === 'DISCONNECTED') {
      throw new Error('ATLASSIAN_REAUTH_REQUIRED: Connection is inactive or requires re-authorization.');
    }

    const now = new Date();
    const expiresAt = new Date(connection.accessTokenExpiresAt);

    // If access token is still valid (not within buffer window), decrypt and return
    if (expiresAt.getTime() - now.getTime() > EXPIRATION_BUFFER_MS) {
      return {
        accessToken: decryptToken(connection.accessTokenEncrypted),
        cloudId: connection.cloudId,
        connectionId: connection.id
      };
    }

    // Token is expiring or expired -> perform refresh
    console.log(`Token for cloudId ${connection.cloudId} near expiry. Refreshing token...`);
    try {
      const decryptedRefreshToken = decryptToken(connection.refreshTokenEncrypted);
      const newTokens = await oauthService.refreshTokens(decryptedRefreshToken);

      const newExpiresAt = new Date(Date.now() + newTokens.expiresIn * 1000);
      const updatedConn = await prisma.atlassianConnection.update({
        where: { id: connection.id },
        data: {
          accessTokenEncrypted: encryptToken(newTokens.accessToken),
          refreshTokenEncrypted: encryptToken(newTokens.refreshToken),
          accessTokenExpiresAt: newExpiresAt,
          status: 'CONNECTED',
          lastRefreshAt: new Date()
        }
      });

      return {
        accessToken: newTokens.accessToken,
        cloudId: updatedConn.cloudId,
        connectionId: updatedConn.id
      };
    } catch (error) {
      console.error(`Failed to refresh token for connection ${connection.id}:`, error.message);
      
      // Mark connection as REAUTH_REQUIRED if refresh fails
      await prisma.atlassianConnection.update({
        where: { id: connection.id },
        data: {
          status: 'REAUTH_REQUIRED'
        }
      }).catch(e => console.error('Failed to update connection status:', e.message));

      throw new Error(`ATLASSIAN_TOKEN_REFRESH_FAILED: ${error.message}`);
    }
  }

  /**
   * Persists a newly authorized connection
   */
  async saveConnection({ cloudId, siteName, siteUrl, accessToken, refreshToken, expiresIn, scopes, connectedByUserId }) {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const encryptedAccess = encryptToken(accessToken);
    const encryptedRefresh = encryptToken(refreshToken);

    const connection = await prisma.atlassianConnection.upsert({
      where: { cloudId: cloudId },
      update: {
        siteName: siteName,
        siteUrl: siteUrl,
        accessTokenEncrypted: encryptedAccess,
        refreshTokenEncrypted: encryptedRefresh,
        accessTokenExpiresAt: expiresAt,
        scopes: scopes,
        status: 'CONNECTED',
        lastValidatedAt: new Date(),
        connectedByUserId: connectedByUserId || null
      },
      create: {
        cloudId: cloudId,
        siteName: siteName,
        siteUrl: siteUrl,
        accessTokenEncrypted: encryptedAccess,
        refreshTokenEncrypted: encryptedRefresh,
        accessTokenExpiresAt: expiresAt,
        scopes: scopes,
        status: 'CONNECTED',
        lastValidatedAt: new Date(),
        connectedByUserId: connectedByUserId || null
      }
    });

    return connection;
  }
}

module.exports = new AtlassianTokenService();
