const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class MeetingNotesAgent {
  async processNotes(meetingId) {
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) return { success: false, message: "Meeting not found" };

    const rawText = meeting.agenda || "";
    const actionItems = this.extractActionItems(rawText);
    
    if (actionItems.length === 0) {
       return { success: true, message: "No actionable items found in meeting notes." };
    }

    const generatedTasks = [];

    for (const item of actionItems) {
      const taskKey = `AUTO-${Math.floor(Math.random() * 1000)}`;
      await prisma.meetingActionItem.create({
        data: {
          meetingId: meeting.id,
          summary: item,
          jiraKey: taskKey,
          status: "Created"
        }
      });
      generatedTasks.push(taskKey);
    }

    return { success: true, generated: generatedTasks, message: `Successfully generated ${generatedTasks.length} Jira tasks from meeting notes.` };
  }
  
  extractActionItems(text) {
    const actions = [];
    const lines = text.split("\n");
    for (const line of lines) {
       const lower = line.toLowerCase();
       if (lower.includes("action:") || lower.includes("todo:") || lower.includes("needs to") || lower.startsWith("- [ ]")) {
          let clean = line.replace(/action:/i, "").replace(/todo:/i, "").replace(/- \[ \]/, "").trim();
          if (clean) actions.push(clean);
       }
    }
    return actions;
  }
}

module.exports = new MeetingNotesAgent();
