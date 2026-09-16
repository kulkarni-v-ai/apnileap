const jiraService = require('./services/atlassian/JiraService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ALLOCATION_ID = '78b50b88-0bcd-4808-b91e-e22ceb0ecf07';

async function run() {
  try {
    console.log('Step 1: Creating Epic in Jira via Atlassian OAuth 3LO...');
    const epicRes = await jiraService.createIssue({
      projectKey: 'AK',
      summary: 'new project',
      description: 'Epic for new project assigned to KLE Spoke',
      issueType: 'Epic',
      labels: ['kle-spoke']
    });

    const epicKey = epicRes.key;
    console.log('  Created Epic:', epicKey);

    console.log('Step 2: Updating allocation in Postgres...');
    await prisma.allocation.update({
      where: { id: ALLOCATION_ID },
      data: { jiraEpicKey: epicKey }
    });
    console.log('  Updated allocation jiraEpicKey to:', epicKey);

    console.log('Step 3: Creating Phase 1 task...');
    const taskRes = await jiraService.createIssue({
      projectKey: 'AK',
      summary: 'Phase 1: Deep Learning Infrastructure Provisioning',
      description: 'Phase 1 setup task for the new project.',
      issueType: 'Task',
      parentKey: epicKey,
      labels: ['kle-spoke']
    });
    console.log('  Created Phase 1 Task:', taskRes.key);

    console.log('\nDone! Epic', epicKey, 'with Phase 1 task', taskRes.key, 'created successfully.');
  } catch (e) {
    console.error('Error in addPhase:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
