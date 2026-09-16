/**
 * Centralized Cloud-Aware Atlassian API Gateway Client
 */
const axios = require('axios');
const tokenService = require('./AtlassianTokenService');
const config = require('../../config/env');

class AtlassianClient {
  /**
   * Executes an HTTP request against Jira Cloud REST API via Atlassian API gateway
   * URL format: https://api.atlassian.com/ex/jira/{cloudId}/{path}
   */
  async request({ method = 'GET', endpoint = '', data = null, params = null, cloudIdOrConnectionId = null }) {
    let tokenInfo = await tokenService.getValidAccessToken(cloudIdOrConnectionId);
    
    // Ensure endpoint starts with slash
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${config.ATLASSIAN_API_BASE_URL}/ex/jira/${tokenInfo.cloudId}${formattedEndpoint}`;

    const makeRequest = async (token) => {
      return await axios({
        method: method,
        url: url,
        data: data,
        params: params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
    };

    try {
      const response = await makeRequest(tokenInfo.accessToken);
      return response.data;
    } catch (error) {
      // Handle 401 Unauthorized -> Refresh token and retry once
      if (error.response && error.response.status === 401) {
        console.warn(`Atlassian API 401 Unauthorized at ${url}. Retrying with fresh token...`);
        try {
          // Force refresh
          tokenInfo = await tokenService.getValidAccessToken(tokenInfo.connectionId);
          const retryResponse = await makeRequest(tokenInfo.accessToken);
          return retryResponse.data;
        } catch (retryError) {
          console.error('Retry after 401 failed:', retryError.message);
          throw this.normalizeError(retryError);
        }
      }

      throw this.normalizeError(error);
    }
  }

  normalizeError(error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const message = data?.errorMessages?.join(', ') || data?.message || error.message;

      const err = new Error(`JIRA_API_ERROR (${status}): ${message}`);
      err.statusCode = status;
      err.jiraData = data;
      return err;
    }
    return error;
  }
}

module.exports = new AtlassianClient();
