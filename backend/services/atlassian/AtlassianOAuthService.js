/**
 * Atlassian OAuth 2.0 (3LO) Service
 */
const axios = require('axios');
const config = require('../../config/env');

class AtlassianOAuthService {
  /**
   * Generates Atlassian 3LO Authorization URL
   */
  getAuthorizeUrl(state) {
    const params = new URLSearchParams({
      audience: 'api.atlassian.com',
      client_id: config.ATLASSIAN_CLIENT_ID,
      scope: config.ATLASSIAN_SCOPES,
      redirect_uri: config.ATLASSIAN_CALLBACK_URL,
      state: state,
      response_type: 'code',
      prompt: 'consent'
    });

    return `${config.ATLASSIAN_OAUTH_AUTHORIZE_URL}?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for Access Token + Refresh Token
   */
  async exchangeCodeForTokens(code) {
    try {
      const response = await axios.post(config.ATLASSIAN_OAUTH_TOKEN_URL, {
        grant_type: 'authorization_code',
        client_id: config.ATLASSIAN_CLIENT_ID,
        client_secret: config.ATLASSIAN_CLIENT_SECRET,
        code: code,
        redirect_uri: config.ATLASSIAN_CALLBACK_URL
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        scope: response.data.scope
      };
    } catch (error) {
      console.error('OAuth Code Exchange Error:', error.response?.data || error.message);
      throw new Error(`ATLASSIAN_TOKEN_EXCHANGE_FAILED: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Refreshes access token using rotating refresh token
   */
  async refreshTokens(refreshToken) {
    try {
      const response = await axios.post(config.ATLASSIAN_OAUTH_TOKEN_URL, {
        grant_type: 'refresh_token',
        client_id: config.ATLASSIAN_CLIENT_ID,
        client_secret: config.ATLASSIAN_CLIENT_SECRET,
        refresh_token: refreshToken
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        scope: response.data.scope
      };
    } catch (error) {
      console.error('OAuth Refresh Token Error:', error.response?.data || error.message);
      throw new Error(`ATLASSIAN_TOKEN_REFRESH_FAILED: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Fetches authorized Atlassian resources (Jira sites & cloud IDs)
   */
  async getAccessibleResources(accessToken) {
    try {
      const response = await axios.get(config.ATLASSIAN_ACCESSIBLE_RESOURCES_URL, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      // Returns array of objects: [{ id, name, url, scopes, avatarUrl }]
      return response.data.map(res => ({
        cloudId: res.id,
        siteName: res.name,
        siteUrl: res.url,
        scopes: Array.isArray(res.scopes) ? res.scopes.join(' ') : (res.scopes || ''),
        avatarUrl: res.avatarUrl || ''
      }));
    } catch (error) {
      console.error('Fetch Accessible Resources Error:', error.response?.data || error.message);
      throw new Error(`ATLASSIAN_ACCESSIBLE_RESOURCES_FAILED: ${error.message}`);
    }
  }
}

module.exports = new AtlassianOAuthService();
