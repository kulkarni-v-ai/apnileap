/**
 * Centralized Environment Configuration & Validation
 */
require('dotenv').config();

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET'
];

function validateEnv() {
  const missing = [];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.warn(`WARNING: Missing essential environment variables: ${missing.join(', ')}`);
  }
}

validateEnv();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5001,
  DATABASE_URL: process.env.DATABASE_URL,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET || 'apnileap_secret_key_change_in_prod',
  
  // Atlassian OAuth 3LO Config
  ATLASSIAN_CLIENT_ID: process.env.ATLASSIAN_CLIENT_ID || '',
  ATLASSIAN_CLIENT_SECRET: process.env.ATLASSIAN_CLIENT_SECRET || '',
  ATLASSIAN_CALLBACK_URL: process.env.ATLASSIAN_CALLBACK_URL || 'http://localhost:5001/api/integrations/atlassian/callback',
  ATLASSIAN_SCOPES: process.env.ATLASSIAN_SCOPES || 'read:jira-work write:jira-work read:jira-user offline_access read:confluence-content.summary write:confluence-content',
  ATLASSIAN_OAUTH_AUTHORIZE_URL: process.env.ATLASSIAN_OAUTH_AUTHORIZE_URL || 'https://auth.atlassian.com/authorize',
  ATLASSIAN_OAUTH_TOKEN_URL: process.env.ATLASSIAN_OAUTH_TOKEN_URL || 'https://auth.atlassian.com/oauth/token',
  ATLASSIAN_ACCESSIBLE_RESOURCES_URL: process.env.ATLASSIAN_ACCESSIBLE_RESOURCES_URL || 'https://api.atlassian.com/oauth/token/accessible-resources',
  ATLASSIAN_API_BASE_URL: process.env.ATLASSIAN_API_BASE_URL || 'https://api.atlassian.com',
  ATLASSIAN_TOKEN_ENCRYPTION_KEY: process.env.ATLASSIAN_TOKEN_ENCRYPTION_KEY || '12345678901234567890123456789012', // 32 chars key

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
};
