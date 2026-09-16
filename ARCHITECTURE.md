# APNILEAP TARGET ARCHITECTURE DOCUMENTATION

## System Overview
APNILEAP is an enterprise work management & campus collaboration platform. Post-migration, the system decouples task execution (handled by Jira Cloud via Atlassian OAuth 2.0 3LO) from governance and relational system-of-record data (handled by PostgreSQL via Prisma).

```text
React / Vite Dashboard
         │
         │ (HTTPS / REST via apiClient.js)
         ▼
Express Backend Services
  ├── PostgreSQL + Prisma (Single System of Record)
  │     ├── Users & Roles
  │     ├── Organizations / Campuses
  │     ├── Projects & Allocations
  │     ├── Teams & Submissions
  │     ├── Meetings & Action Items
  │     ├── Audit Logs
  │     └── Atlassian Connections & OAuth Tokens (AES-256-GCM)
  │
  └── Atlassian OAuth Service (3LO)
        │
        ▼ (api.atlassian.com/ex/jira/{cloudId}/...)
   Jira Cloud Workspace
```

## Key Architectural Principles

1. **System of Record**: PostgreSQL + Prisma is the single runtime database. MongoDB and Mongoose dependencies have been completely removed.
2. **Dynamic OAuth 3LO Authentication**: No Basic Auth credentials (`JIRA_EMAIL`, `JIRA_API_TOKEN`) or static site domains (`atlassian.net`) exist in runtime source code.
3. **Cloud-ID Discovery**: Atlassian API Gateway (`api.atlassian.com/ex/jira/{cloudId}/...`) is dynamically resolved per tenant connection.
4. **Token Security & Auto-Rotation**: Access and refresh tokens are encrypted at rest using AES-256-GCM. Rotating refresh tokens are automatically renewed prior to expiration.
5. **Normalized Data Contract**: The frontend interacts exclusively with normalized APNILEAP domain models via `apiClient.js`.
