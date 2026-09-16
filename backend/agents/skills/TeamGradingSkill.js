const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class TeamGradingSkill {
  async execute(prompt, context) {
    const { userRole } = context;

    if (userRole !== "Corporate Sponsor" && userRole !== "Spoke Coordinator") {
       return { success: true, response: `🔒 **Access Denied:** Only Corporate Sponsors can evaluate final team projects.` };
    }
    
    // "grade team Alpha A"
    const parts = prompt.split(" ");
    const grade = parts.pop().toUpperCase();
    const teamName = parts.slice(2).join(" ");
    
    const team = await prisma.team.findFirst({
      where: { name: { contains: teamName, mode: 'insensitive' } }
    });
    if (!team) return { success: true, response: `⚠️ I could not find a team named **${teamName}**.` };
    
    const currentProgress = typeof team.finalProgress === 'object' && team.finalProgress ? team.finalProgress : {};
    const updatedProgress = {
      ...currentProgress,
      status: "Evaluated",
      companyGrade: grade,
      companyFeedback: "🤖 [Rovo Agent Swarm]: Excellent work. Auto-evaluated."
    };

    await prisma.team.update({
      where: { id: team.id },
      data: { finalProgress: updatedProgress }
    });
    
    return { success: true, response: `✨ **Team Graded!**\n\nTeam **${teamName}** has been assigned a final grade of **${grade}**.` };
  }
}

module.exports = new TeamGradingSkill();
