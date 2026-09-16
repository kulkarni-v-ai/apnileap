const tokenService = require('../services/atlassian/AtlassianTokenService');
const axios = require('axios');
const config = require('../config/env');

const SPACE_ID = "262148";

/**
 * Creates a new Confluence Page for an accepted project using Atlassian OAuth 3LO
 */
async function createProjectWorkspace(projectTitle, epicKey, company, spokeName, cloudId = null) {
  try {
    let tokenInfo;
    try {
      tokenInfo = await tokenService.getValidAccessToken(cloudId);
    } catch (e) {
      console.warn('Confluence integration skipped: Atlassian OAuth not connected.', e.message);
      return { success: false, reason: 'ATLASSIAN_NOT_CONNECTED' };
    }

    const pageTitle = `[${epicKey}] ${projectTitle} (${spokeName})`;
    
    const bodyData = {
      spaceId: SPACE_ID,
      status: "current",
      title: pageTitle,
      body: {
        representation: "storage",
        value: `
          <h1>${projectTitle}</h1>
          <p><strong>Sponsor:</strong> ${company}</p>
          <p><strong>Spoke:</strong> ${spokeName}</p>
          <p><strong>Jira Epic:</strong> ${epicKey}</p>
          <hr/>
          <h2>Project Requirements</h2>
          <p>Please refer to the Jira Epic for detailed tasks and deadlines.</p>
          <h2>Student Deliverables</h2>
          <p><em>All documents uploaded by students in APNILEAP will automatically appear here.</em></p>
        `
      }
    };

    const url = `${config.ATLASSIAN_API_BASE_URL}/ex/confluence/${tokenInfo.cloudId}/wiki/api/v2/pages`;

    const response = await axios.post(url, bodyData, {
      headers: {
        'Authorization': `Bearer ${tokenInfo.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Confluence Workspace Created: ${pageTitle}`);
    return {
      success: true,
      pageId: response.data.id,
      url: response.data._links ? `${config.ATLASSIAN_API_BASE_URL}${response.data._links.webui}` : ''
    };
  } catch (error) {
    console.warn("Confluence page creation notice:", error.response ? error.response.data : error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  createProjectWorkspace
};
