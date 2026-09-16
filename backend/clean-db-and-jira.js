const { PrismaClient } = require('@prisma/client');
const jiraService = require('./services/atlassian/JiraService');
require('dotenv').config();

const prisma = new PrismaClient();

async function cleanJira() {
  console.log('Connecting to Jira via Atlassian OAuth 3LO...');
  try {
    const issues = await jiraService.getBoardIssues('101');
    console.log(`Found ${issues.length} issues in Jira board 101.`);
    // Issue cleanup logic
  } catch (err) {
    console.warn("Jira cleanup notice:", err.message);
  }
}

async function cleanPostgres() {
  console.log("Clearing PostgreSQL data...");
  try {
    await prisma.meetingActionItem.deleteMany({});
    await prisma.meetingInvite.deleteMany({});
    await prisma.meeting.deleteMany({});
    await prisma.submission.deleteMany({});
    await prisma.chatMessage.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.allocation.deleteMany({});
    await prisma.projectPhase.deleteMany({});
    await prisma.project.deleteMany({});
    console.log("PostgreSQL data cleared successfully.");
  } catch (err) {
    console.error("Error clearing PostgreSQL:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  await cleanJira();
  await cleanPostgres();
  console.log("Database reset complete!");
}

run();
