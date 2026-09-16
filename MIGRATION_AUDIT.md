# APNILEAP — MIGRATION AUDIT REPORT

## 1. Executive Summary & Overview
This audit report documents the current state of the APNILEAP repository, detailing the legacy MongoDB/Mongoose data architecture, legacy Basic Auth Jira integration, hardcoded values across frontend and backend, mock data paths, and the detailed architectural target state for Atlassian OAuth 2.0 (3LO) and PostgreSQL + Prisma migration.

---

## 2. Current Architecture

```text
[ React / Vite Frontend ] 
      │ (Hardcoded Axios calls to http://localhost:5001)
      ▼
[ Express Backend (Monolithic server.js) ]
   ├── Mongoose (MongoDB URI) ────► MongoDB Server (System of Record)
   ├── Basic Auth (JIRA_EMAIL / JIRA_API_TOKEN) ────► https://<JIRA_DOMAIN>.atlassian.net
   └── Fallback Mock Store (mockTasksStore) ── (Used when Jira calls fail or during offline mode)
```

---

## 3. Current Database Architecture (MongoDB / Mongoose)

The current database layer relies on **Mongoose 9.6.3** connecting via `MONGODB_URI`.
Primary collections & schemas in `backend/models/`:

1. **`User`** (`User.js`):
   - Fields: `email`, `password`, `displayName`, `role`, `persona`, `spokeId`, `createdAt`.
   - Purpose: Stores APNILEAP user accounts.
2. **`CorporateProject`** (`CorporateProject.js`):
   - Fields: `company`, `logoUrl`, `title`, `description`, `budget`, `duration`, `status`, `assignedTo`, `targetCampusId`, `proposedDueDate`, `assignedKey`, `facultyMentor`, `projectMentor`, `dateAdded`, `problemStatementUrl`, `requirements`, `phases` (array of objects), `allocations` (array of nested `AllocationSchema` objects).
3. **`Team`** (`Team.js`):
   - Fields: `name`, `boardId`, `members` (array of objects with `accountId`, `displayName`, `emailAddress`, `avatarUrl`), `mentor`, `teamLeader`, `projectId`, `subMentor`, `githubRepo`, `finalProgress` (nested object), `createdAt`.
4. **`Submission`** (`Submission.js`):
   - Fields: `taskId`, `studentName`, `fileName`, `fileUrl`, `comments`, `status`, `feedback`, `grade`, `version`, `reworkHistory` (array of objects), `submittedAt`.
5. **`Meeting`** (`Meeting.js`):
   - Fields: `id`, `title`, `campusId`, `date`, `time`, `link`, `agenda`, `cadenceType`, `meetingNotes`, `actionItems` (array of objects with `summary`, `jiraKey`, `status`, `createdAt`), `notesPostedAt`, `reminderSentAt`.
6. **`ChatMessage`** (`ChatMessage.js`):
   - Fields: `sender`, `message`, `campus`, `createdAt`.
7. **`MockTask`** (`MockTask.js`):
   - Fields: `id`, `key`, `boardId`, `fields` (Mixed). Used as a synthetic Jira issue mock store.

---

## 4. Current Prisma Schema & PostgreSQL Gaps

Existing schema at `backend/prisma/schema.prisma`:
- Contains: `User`, `Project`, `Allocation`, `MentorAssignment`, `Campus`, `Company`, `Meeting`, `AuditLog`, `Team`, `StudentAssignment`, `Message`, `MeetingInvite`, `Document`.
- **Gaps to address**:
  - `User`: missing `persona`, `spokeId`.
  - `Project`: missing `problemStatementUrl`, `requirements`, `phases`.
  - `Allocation`: missing `facultyMentor`, `projectMentor`, `assignedKey`.
  - `Team`: missing `boardId`, `mentor`, `teamLeader`, `subMentor`, `githubRepo`, `finalProgress` (or sub-table/JSON).
  - `Submission`: Missing completely in Prisma.
  - `Meeting`: missing `cadenceType`, `meetingNotes`, `notesPostedAt`, `reminderSentAt`, `actionItems` sub-table.
  - `ChatMessage`: Missing or represented as `Message` without campus binding.
  - `AtlassianConnection`: Missing completely.
  - `AtlassianResource`: Missing completely.
  - `JiraProject` & `JiraBoard`: Missing explicit mappings.
  - `SyncLog` / `SyncMetadata`: Missing.

---

## 5. Current Jira Architecture & Basic Auth Endpoints

Current endpoints called in `server.js`, `jira-setup.js`, `clean-db-and-jira.js`, `confluence.js`, and `JiraCommunicationSkill.js`:
- `GET /rest/api/2/myself` (User check)
- `GET /rest/api/2/user/assignable/search?project=AK` (User search)
- `GET /rest/agile/1.0/board/{boardId}/issue` (Board issues)
- `POST /rest/api/2/issue` or `/rest/api/3/issue` (Create Epic / Task / Subtask)
- `PUT /rest/api/2/issue/{key}` or `/rest/api/3/issue/{key}` (Update issue)
- `DELETE /rest/api/3/issue/{id}` (Delete issue)
- `GET /rest/api/2/issue/{key}/transitions` & `POST /rest/api/2/issue/{key}/transitions` (Transitions)
- `POST /rest/api/2/issue/{key}/worklog` (Worklog creation)
- `POST /rest/api/2/issueLink` (Issue linking)
- `GET /rest/agile/1.0/board/{boardId}/sprint?state=active` (Active sprint)
- `GET /rest/agile/1.0/sprint/{sprintId}/issue` (Sprint issues)
- `POST /rest/agile/1.0/sprint` (Create sprint)
- `POST /rest/agile/1.0/board` (Create board)
- `POST /rest/api/3/filter` (Create filter)
- `/wiki/api/v2/spaces` & `/wiki/api/v2/pages` (Confluence space/page integration)

---

## 6. Frontend API Endpoints & Hardcoded Values Audit

### Frontend Hardcoded Backend URLs:
- Over 68 occurrences of `http://localhost:5001/...` hardcoded across:
  - `frontend/src/App.jsx`
  - `frontend/src/components/TeamChat.jsx`
  - `frontend/src/components/StudentDashboardView.jsx`
  - `frontend/src/components/ManageTeamsModal.jsx`
  - `frontend/src/components/InviteToMeetingModal.jsx`
  - `frontend/src/components/FIPProgressModal.jsx`
  - `frontend/src/components/DocumentsView.jsx`
  - `frontend/src/components/CreateSprintModal.jsx`
  - `frontend/src/components/AssignMentorsModal.jsx`

### Hardcoded Campus Mappings:
- `server.js` contains hardcoded `CAMPUSES` dictionary:
  - `"3"` -> RIT Spoke (`APNN`)
  - `"101"` -> Hub (`AK`)
  - `"102"` -> Campus B
  - `"103"` -> Campus C
- Hardcoded domain: `https://manasa-kle-apnileap.atlassian.net` input box in settings in `App.jsx`.

---

## 7. Mock / Fallback Paths

- `mockTasksStore` in `server.js`: In-memory array of mock issues populated when Jira network requests fail.
- `shouldCheckJira()` & `isJiraOffline`: Circuit breaker pattern that turns off live Jira calls and switches silently to `MockTask` MongoDB collection or in-memory arrays.
- `CAMPUS_TEAM_MEMBERS`, `MOCK_ASSIGNEES`, `STUDENT_DEVELOPERS`: Hardcoded arrays in backend/frontend.

---

## 8. Migration Risks & Mitigation Strategy

| Risk | Impact | Mitigation |
|---|---|---|
| **Data Loss during Mongo -> Postgres Migration** | High | Create `backend/scripts/migrate-mongodb-to-postgres.js` with comprehensive document transformation, deterministic mapping, strict foreign keys, and loud failure logging. |
| **Atlassian 3LO Refresh Token Expiry/Rotation** | High | Implement centralized `AtlassianTokenService.js` with AES-256-GCM token encryption, rotation tracking, and auto-refresh prior to API invocation. |
| **Broken Frontend API Calls** | High | Implement `frontend/src/services/apiClient.js` using `import.meta.env.VITE_API_BASE_URL` and replace all raw axios calls. |
| **Monolithic Server Complexity** | Medium | Modularize `server.js` into clean `controllers/`, `services/`, `repositories/`, `routes/`, `prisma/`. |

---

## 9. Proposed Target Architecture

```text
React Dashboard
      │ (HTTPS / REST via apiClient.js)
      ▼
APNILEAP Backend Express
   ├── PostgreSQL + Prisma (Single System of Record)
   └── Atlassian OAuth Service (3LO)
         ├── Token Exchange / Auto-Refresh (AES-256-GCM)
         ├── Accessible Resources / Cloud ID Resolution
         ▼
   api.atlassian.com/ex/jira/{cloudId}/...
         ▼
   Jira Cloud
```

---

## 10. Verification & Validation Plan

1. **Database Verification**:
   - `npm run migrate:mongo` runs cleanly.
   - Verify table counts in PostgreSQL equal or exceed Mongo document counts.
   - Foreign key integrity check.
2. **OAuth 3LO Flow Verification**:
   - Initiate Atlassian OAuth redirect from UI.
   - Handle callback, exchange code for tokens, fetch accessible resources, save encrypted connection in Postgres.
3. **Jira Operations Verification**:
   - Projects, Epics, Tasks, Sprints, Worklogs, Transitions fetch and update live via `api.atlassian.com`.
4. **Static Hardcoding Audit**:
   - Zero occurrences of `mongoose`, `MongoClient`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `http://localhost:5001`, `manasa-kle-apnileap`.
