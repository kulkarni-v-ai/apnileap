/**
 * Comprehensive Jira Service Layer
 * Abstracts raw Jira Cloud REST API calls and returns normalized APNILEAP domain objects.
 */
const client = require('./AtlassianClient');

class JiraService {
  /**
   * Normalizes raw Jira issue object to APNILEAP Task schema
   */
  normalizeTask(item) {
    if (!item) return null;

    const fields = item.fields || {};
    return {
      id: item.id || item.key,
      externalId: item.id,
      externalKey: item.key,
      key: item.key,
      title: fields.summary || 'Untitled Task',
      summary: fields.summary || '',
      description: typeof fields.description === 'string' ? fields.description : (fields.description?.content?.[0]?.content?.[0]?.text || ''),
      status: fields.status?.name || 'To Do',
      statusCategory: fields.status?.statusCategory?.name || 'To Do',
      priority: fields.priority?.name || 'Medium',
      issueType: fields.issuetype?.name || 'Task',
      assignee: fields.assignee ? {
        accountId: fields.assignee.accountId,
        displayName: fields.assignee.displayName,
        emailAddress: fields.assignee.emailAddress || '',
        avatarUrl: fields.assignee.avatarUrls?.['48x48'] || ''
      } : null,
      reporter: fields.reporter ? {
        accountId: fields.reporter.accountId,
        displayName: fields.reporter.displayName,
        emailAddress: fields.reporter.emailAddress || '',
        avatarUrl: fields.reporter.avatarUrls?.['48x48'] || ''
      } : null,
      dueDate: fields.duedate || null,
      created: fields.created || null,
      updated: fields.updated || null,
      labels: fields.labels || [],
      sprint: fields.sprint ? {
        id: fields.sprint.id,
        name: fields.sprint.name,
        state: fields.sprint.state
      } : null,
      project: fields.project ? {
        id: fields.project.id,
        key: fields.project.key,
        name: fields.project.name
      } : null,
      fields: fields // Retained for backwards compatibility where legacy components access nested fields
    };
  }

  /**
   * Get current authenticated Atlassian User details
   */
  async getMyself(cloudId) {
    const res = await client.request({
      method: 'GET',
      endpoint: '/rest/api/3/myself',
      cloudIdOrConnectionId: cloudId
    });
    return {
      accountId: res.accountId,
      displayName: res.displayName,
      emailAddress: res.emailAddress,
      avatarUrl: res.avatarUrls?.['48x48']
    };
  }

  /**
   * Fetch assignable users for a project
   */
  async getAssignableUsers(projectKey, cloudId) {
    const users = await client.request({
      method: 'GET',
      endpoint: '/rest/api/3/user/assignable/search',
      params: { project: projectKey },
      cloudIdOrConnectionId: cloudId
    });

    return (users || []).map(u => ({
      accountId: u.accountId,
      displayName: u.displayName,
      emailAddress: u.emailAddress || '',
      avatarUrl: u.avatarUrls?.['48x48'] || ''
    }));
  }

  /**
   * Fetch issues on a specific board
   */
  async getBoardIssues(boardId, cloudId) {
    const res = await client.request({
      method: 'GET',
      endpoint: `/rest/agile/1.0/board/${boardId}/issue`,
      params: { maxResults: 100 },
      cloudIdOrConnectionId: cloudId
    });

    const rawIssues = res.issues || [];
    return rawIssues.map(item => this.normalizeTask(item));
  }

  /**
   * Create a new Jira issue (Epic, Task, Subtask)
   */
  async createIssue({ projectKey, summary, description, issueType = 'Task', parentKey = null, assigneeAccountId = null, duedate = null, labels = [] }, cloudId) {
    const fields = {
      project: { key: projectKey },
      summary: summary,
      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: description || summary }
            ]
          }
        ]
      },
      issuetype: { name: issueType }
    };

    if (parentKey) {
      fields.parent = { key: parentKey };
    }

    if (assigneeAccountId) {
      fields.assignee = { accountId: assigneeAccountId };
    }

    if (duedate) {
      fields.duedate = duedate;
    }

    if (labels && labels.length > 0) {
      fields.labels = labels;
    }

    const res = await client.request({
      method: 'POST',
      endpoint: '/rest/api/3/issue',
      data: { fields },
      cloudIdOrConnectionId: cloudId
    });

    return {
      id: res.id,
      key: res.key,
      self: res.self
    };
  }

  /**
   * Update issue fields
   */
  async updateIssue(issueIdOrKey, updateData, cloudId) {
    const fields = {};
    if (updateData.summary) fields.summary = updateData.summary;
    if (updateData.description) {
      fields.description = {
        type: 'doc',
        version: 1,
        content: [{ type: 'paragraph', content: [{ type: 'text', text: updateData.description }] }]
      };
    }
    if (updateData.assigneeAccountId !== undefined) {
      fields.assignee = updateData.assigneeAccountId ? { accountId: updateData.assigneeAccountId } : null;
    }
    if (updateData.duedate) fields.duedate = updateData.duedate;

    await client.request({
      method: 'PUT',
      endpoint: `/rest/api/3/issue/${issueIdOrKey}`,
      data: { fields },
      cloudIdOrConnectionId: cloudId
    });

    return { success: true, key: issueIdOrKey };
  }

  /**
   * Get available transitions for an issue
   */
  async getTransitions(issueIdOrKey, cloudId) {
    const res = await client.request({
      method: 'GET',
      endpoint: `/rest/api/3/issue/${issueIdOrKey}/transitions`,
      cloudIdOrConnectionId: cloudId
    });
    return res.transitions || [];
  }

  /**
   * Transition issue to a new status
   */
  async transitionIssue(issueIdOrKey, targetStatusNameOrId, cloudId) {
    const transitions = await this.getTransitions(issueIdOrKey, cloudId);
    const target = transitions.find(t => 
      t.id === targetStatusNameOrId || 
      t.name.toLowerCase() === String(targetStatusNameOrId).toLowerCase() ||
      t.to?.name.toLowerCase() === String(targetStatusNameOrId).toLowerCase()
    );

    if (!target) {
      throw new Error(`TRANSITION_NOT_AVAILABLE: Status '${targetStatusNameOrId}' is not valid for issue ${issueIdOrKey}.`);
    }

    await client.request({
      method: 'POST',
      endpoint: `/rest/api/3/issue/${issueIdOrKey}/transitions`,
      data: { transition: { id: target.id } },
      cloudIdOrConnectionId: cloudId
    });

    return { success: true, issueKey: issueIdOrKey, newStatus: target.name };
  }

  /**
   * Add worklog to issue
   */
  async addWorklog(issueIdOrKey, { timeSpentSeconds, comment }, cloudId) {
    const res = await client.request({
      method: 'POST',
      endpoint: `/rest/api/3/issue/${issueIdOrKey}/worklog`,
      data: {
        timeSpentSeconds: timeSpentSeconds,
        comment: {
          type: 'doc',
          version: 1,
          content: [{ type: 'paragraph', content: [{ type: 'text', text: comment || '' }] }]
        }
      },
      cloudIdOrConnectionId: cloudId
    });
    return res;
  }

  /**
   * Fetch active sprints for a board
   */
  async getActiveSprints(boardId, cloudId) {
    const res = await client.request({
      method: 'GET',
      endpoint: `/rest/agile/1.0/board/${boardId}/sprint`,
      params: { state: 'active' },
      cloudIdOrConnectionId: cloudId
    });
    return res.values || [];
  }

  /**
   * Create a sprint on a board
   */
  async createSprint({ boardId, name, startDate, endDate }, cloudId) {
    const res = await client.request({
      method: 'POST',
      endpoint: '/rest/agile/1.0/sprint',
      data: {
        name: name,
        originBoardId: parseInt(boardId, 10),
        startDate: startDate,
        endDate: endDate
      },
      cloudIdOrConnectionId: cloudId
    });
    return res;
  }
}

module.exports = new JiraService();
