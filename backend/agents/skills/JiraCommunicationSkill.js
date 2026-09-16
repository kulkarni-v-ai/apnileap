const { PrismaClient } = require('@prisma/client');
const jiraService = require('../../services/atlassian/JiraService');

const prisma = new PrismaClient();

class JiraCommunicationSkill {
  
  async execute(prompt, context) {
    const { userRole, cloudId, invalidateCache } = context;
    const pLower = prompt.toLowerCase();

    // 1. APPROVE TASK
    if (pLower.startsWith("approve ")) {
      if (userRole !== "Faculty Mentor" && userRole !== "Spoke Coordinator") {
         return { success: true, response: `🔒 **Access Denied:** Only Faculty Mentors can approve student deliverables.` };
      }
      const tKey = prompt.substring("approve ".length).trim().toUpperCase();
      
      const submission = await prisma.submission.findFirst({ where: { taskId: tKey } });
      if (!submission) return { success: true, response: `⚠️ I could not find a submitted deliverable for task **${tKey}**.` };
      
      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: "Approved",
          grade: "A",
          feedback: "🤖 [Rovo Agent]: Approved by AI."
        }
      });

      this.triggerJiraTransition(tKey, "Done", cloudId);
      return { success: true, response: `✨ **Task Evaluated!**\n\nI graded **${tKey}** with an A and moved it to Done.` };
    }

    // 2. BLOCK TASK
    if (pLower.startsWith("block ")) {
      if (userRole !== "Student Developer" && userRole !== "Faculty Mentor") {
         return { success: true, response: `🔒 **Access Denied:** Only assigned Students or Faculty can flag a task as blocked.` };
      }
      const tKey = prompt.substring("block ".length).trim().toUpperCase();
      
      this.triggerJiraTransition(tKey, "Blocked", cloudId);
      if (invalidateCache) invalidateCache();
      return { success: true, response: `🚨 **Task Blocked!**\n\nI have flagged **${tKey}** as Blocked. A notification will be sent.` };
    }

    // 3. ASSIGN TASK
    if (pLower.startsWith("assign me to ")) {
      if (userRole !== "Student Developer") {
         return { success: true, response: `🔒 **Access Denied:** Only Students can self-assign tasks.` };
      }
      const tKey = prompt.substring("assign me to ".length).trim().toUpperCase();
      
      this.triggerJiraTransition(tKey, "In Progress", cloudId);
      if (invalidateCache) invalidateCache();
      return { success: true, response: `✨ **Assigned!**\n\nYou are now assigned to **${tKey}**. It has been automatically moved to In Progress. Happy coding!` };
    }

    return { success: false, response: "Command not recognized by JiraCommunicationSkill." };
  }

  async triggerJiraTransition(tKey, targetStatus, cloudId) {
     try {
       await jiraService.transitionIssue(tKey, targetStatus, cloudId);
     } catch (e) {
       console.warn(`Jira transition warning for ${tKey}:`, e.message);
     }
  }
}

module.exports = new JiraCommunicationSkill();
