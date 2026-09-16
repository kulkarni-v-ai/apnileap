# APNILEAP — Enterprise Campus Work Management Platform

APNILEAP is an enterprise work management & campus project tracking platform built with React/Vite, Express Node.js, PostgreSQL (Prisma), and Atlassian OAuth 2.0 (3LO) integration.

---

## Technical Stack
- **Frontend**: React, Vite, Lucide Icons, Recharts, Axios (`apiClient.js`)
- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL
- **Integrations**: Atlassian OAuth 2.0 3LO (Jira Cloud REST API) with AES-256-GCM token security

---

## Quick Start Guide

### 1. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npm run migrate:mongo   # Run Mongo -> PostgreSQL data migration utility
npm run start           # Or npm run dev for nodemon
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## Documentation
- `MIGRATION_AUDIT.md`: Audit of original vs target architecture.
- `ARCHITECTURE.md`: Technical system overview.
- `DATA_OWNERSHIP.md`: Source of truth policy matrix.
- `ATLASSIAN_API_MATRIX.md`: Jira Cloud REST API endpoints & scopes mapping.
- `MIGRATION_RUNBOOK.md`: Step-by-step database migration guide.
- `OAUTH_SETUP.md`: Atlassian Developer Console app setup guide.
