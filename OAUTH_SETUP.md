# ATLASSIAN OAUTH 2.0 (3LO) SETUP GUIDE

This guide explains how to create and configure an OAuth 2.0 3LO Integration App on the Atlassian Developer Console.

---

## 1. Create Atlassian App
1. Go to [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/).
2. Click **Create** -> **OAuth 2.0 (3LO) integration**.
3. Name the application `APNILEAP Integration`.

---

## 2. Configure Permissions (Scopes)
Under **Authorization**, add the following API Scopes:

### Jira API Scopes:
- `read:jira-work`
- `write:jira-work`
- `read:jira-user`
- `offline_access` (Required for Refresh Tokens)

### Confluence API Scopes (Optional):
- `read:confluence-content.summary`
- `write:confluence-content`

---

## 3. Configure Callback URL
1. Under **Authorization** -> **OAuth 2.0 (3LO)** -> **Callback URL**, enter:
   ```text
   http://localhost:5001/api/integrations/atlassian/callback
   ```
2. Save changes.

---

## 4. Copy Client Credentials
1. Go to **Settings** -> **App Details**.
2. Copy **Client ID** and **Client Secret**.
3. Set them in `backend/.env`:
   ```env
   ATLASSIAN_CLIENT_ID=<your-client-id>
   ATLASSIAN_CLIENT_SECRET=<your-client-secret>
   ATLASSIAN_CALLBACK_URL=http://localhost:5001/api/integrations/atlassian/callback
   ```
