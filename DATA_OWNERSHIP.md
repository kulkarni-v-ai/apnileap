# DATA OWNERSHIP & SYSTEM OF RECORD POLICY

This document defines the clear source-of-truth ownership boundaries between APNILEAP PostgreSQL and Jira Cloud.

| Entity / Field | System of Record | Rationale & Sync Direction |
|---|---|---|
| User Identity & Roles | PostgreSQL | APNILEAP controls authentication, roles (Admin, Moderator, Student, Mentor), and campus permissions. |
| Organization / Campus | PostgreSQL | Governance boundaries and tenant configurations reside in PostgreSQL. |
| Project Governance & Allocation | PostgreSQL | Project budgets, company sponsors, target campuses, and status transitions reside in PostgreSQL. |
| Teams & Member Assignments | PostgreSQL | Team composition and mentor relationships are stored in PostgreSQL. |
| Jira Issue Key / ID Mapping | PostgreSQL | `SyncMetadata` links internal APNILEAP entity IDs to external Jira cloud IDs and keys. |
| Jira Task Title & Description | Jira Cloud | Jira execution system is source of truth for task content. Synced to APNILEAP. |
| Jira Issue Status | Jira Cloud | Sprint status, board columns, and workflow transitions occur in Jira Cloud. |
| Task Submissions & Grades | PostgreSQL | Student file submissions, reworking histories, and grades reside in PostgreSQL. |
| Meetings & Action Items | PostgreSQL | Meeting schedules, agendas, and action items reside in PostgreSQL; action items optionally provision Jira issues. |
| OAuth Tokens & Connections | PostgreSQL | Atlassian OAuth connection states and AES-256-GCM encrypted tokens reside strictly in PostgreSQL. |
