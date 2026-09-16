# ATLASSIAN JIRA CLOUD REST API MAPPING MATRIX

This matrix details all Jira Cloud REST API endpoints utilized by APNILEAP post 3LO migration.

| APNILEAP Operation | Jira API Endpoint | HTTP Method | OAuth 3LO Scope Required | Service Layer |
|---|---|---|---|---|
| Get User Profile | `/rest/api/3/myself` | GET | `read:jira-user` | `JiraService.getMyself` |
| Search Assignable Users | `/rest/api/3/user/assignable/search` | GET | `read:jira-user` | `JiraService.getAssignableUsers` |
| Get Board Issues | `/rest/agile/1.0/board/{boardId}/issue` | GET | `read:jira-work` | `JiraService.getBoardIssues` |
| Create Issue / Epic / Task | `/rest/api/3/issue` | POST | `write:jira-work` | `JiraService.createIssue` |
| Update Issue | `/rest/api/3/issue/{issueIdOrKey}` | PUT | `write:jira-work` | `JiraService.updateIssue` |
| Get Transitions | `/rest/api/3/issue/{issueIdOrKey}/transitions` | GET | `read:jira-work` | `JiraService.getTransitions` |
| Perform Transition | `/rest/api/3/issue/{issueIdOrKey}/transitions` | POST | `write:jira-work` | `JiraService.transitionIssue` |
| Add Worklog | `/rest/api/3/issue/{issueIdOrKey}/worklog` | POST | `write:jira-work` | `JiraService.addWorklog` |
| Get Active Sprints | `/rest/agile/1.0/board/{boardId}/sprint` | GET | `read:jira-work` | `JiraService.getActiveSprints` |
| Create Sprint | `/rest/agile/1.0/sprint` | POST | `write:jira-work` | `JiraService.createSprint` |
| Accessible Resources | `/oauth/token/accessible-resources` | GET | N/A (Bearer Auth) | `AtlassianOAuthService.getAccessibleResources` |
