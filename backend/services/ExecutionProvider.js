/**
 * APNILEAP ExecutionProvider Abstraction Layer
 * Abstracts work execution engines (Jira, GitHub, Linear, etc.)
 */
const jiraService = require('./atlassian/JiraService');

class ExecutionProvider {
  async getTasks(params) { throw new Error('Not implemented'); }
  async createTask(taskData) { throw new Error('Not implemented'); }
  async updateTask(taskId, taskData) { throw new Error('Not implemented'); }
  async transitionTask(taskId, status) { throw new Error('Not implemented'); }
  async getMembers(params) { throw new Error('Not implemented'); }
}

class JiraExecutionProvider extends ExecutionProvider {
  async getTasks({ boardId, cloudId }) {
    if (!boardId) {
      throw new Error('BOARD_ID_REQUIRED: Board ID is required to fetch tasks.');
    }
    return await jiraService.getBoardIssues(boardId, cloudId);
  }

  async createTask(taskData, cloudId) {
    return await jiraService.createIssue(taskData, cloudId);
  }

  async updateTask(taskId, updateData, cloudId) {
    return await jiraService.updateIssue(taskId, updateData, cloudId);
  }

  async transitionTask(taskId, targetStatus, cloudId) {
    return await jiraService.transitionIssue(taskId, targetStatus, cloudId);
  }

  async getMembers({ projectKey, cloudId }) {
    return await jiraService.getAssignableUsers(projectKey, cloudId);
  }
}

module.exports = {
  ExecutionProvider,
  JiraExecutionProvider: new JiraExecutionProvider()
};
