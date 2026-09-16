# MIGRATION RUNBOOK — MONGODB TO POSTGRESQL & ATLASSIAN 3LO

## Overview
This runbook provides step-by-step instructions for executing database migration and setting up Atlassian OAuth 2.0 (3LO) in APNILEAP.

---

## Step 1: Environment Configuration
1. Copy `.env.example` to `.env` in `backend/`:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Configure `DATABASE_URL` (PostgreSQL connection string) and `MONGODB_URI` (legacy MongoDB string).
3. Set `ATLASSIAN_CLIENT_ID`, `ATLASSIAN_CLIENT_SECRET`, and `ATLASSIAN_TOKEN_ENCRYPTION_KEY` (32 characters).

---

## Step 2: PostgreSQL Schema Setup (Prisma)
Run Prisma schema generation and migrations:
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

---

## Step 3: Execute Mongo → PostgreSQL Data Migration
Run the idempotent data migration script:
```bash
cd backend
npm run migrate:mongo
```
Verify the output report summary table to ensure all documents in `users`, `corporateprojects`, `teams`, `submissions`, `meetings`, and `chatmessages` are migrated with 0 failures.

---

## Step 4: Frontend API Base Configuration
1. Copy `frontend/.env.example` to `frontend/.env`:
   ```bash
   cp frontend/.env.example frontend/.env
   ```
2. Ensure `VITE_API_BASE_URL` points to backend (e.g. `http://localhost:5001`).

---

## Step 5: Start Backend & Frontend
Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

---

## Step 6: Connect Atlassian OAuth Account
1. Open APNILEAP Dashboard in browser.
2. Navigate to **Settings** -> **Integrations** -> **Atlassian**.
3. Click **Connect Atlassian Account**.
4. Log in and grant consent on Atlassian's authorization screen.
5. Upon redirect, confirm the connection status badge displays **● CONNECTED**.
