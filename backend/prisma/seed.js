/**
 * PostgreSQL Prisma Seed Script for APNILEAP
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting APNILEAP PostgreSQL Seeding...');

  // 1. Seed Campuses
  const campuses = [
    { id: '101', name: 'Hub Campus (AK)', jiraBoardKey: 'AK', jiraBoardId: '101', jiraProjectKey: 'AK' },
    { id: '3', name: 'RIT Spoke Campus (APNN)', jiraBoardKey: 'APNN', jiraBoardId: '3', jiraProjectKey: 'PNLP' },
    { id: '102', name: 'Campus B', jiraBoardKey: 'CAMPB', jiraBoardId: '102', jiraProjectKey: 'CAMPB' },
    { id: '103', name: 'Campus C', jiraBoardKey: 'CAMPC', jiraBoardId: '103', jiraProjectKey: 'CAMPC' }
  ];

  for (const c of campuses) {
    await prisma.campus.upsert({
      where: { id: c.id },
      update: c,
      create: c
    });
  }
  console.log('✅ Campuses seeded successfully.');

  // 2. Seed Default Admin User
  const defaultPassword = await bcrypt.hash('Admin@12345', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@apnileap.com' },
    update: {
      displayName: 'Central Admin',
      role: 'ADMIN',
      persona: 'moderator',
      status: 'APPROVED'
    },
    create: {
      email: 'admin@apnileap.com',
      password: defaultPassword,
      displayName: 'Central Admin',
      role: 'ADMIN',
      persona: 'moderator',
      status: 'APPROVED',
      campusId: '101'
    }
  });
  console.log(`✅ Default Admin user created/verified (${admin.email}).`);

  // 3. Seed Default Demo Corporate Projects
  const defaultProjects = [
    {
      id: 'proj-demo-101',
      company: 'NVIDIA',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Nvidia_logo.svg',
      title: 'Real-Time Sign Language Translator',
      description: 'Build a GPU-accelerated computer vision pipeline that translates Indian Sign Language gestures into text and speech in real time using deep learning.',
      budget: '$18,000',
      duration: '5 Months',
      status: 'Active',
      targetCampusId: '3',
      dateAdded: new Date().toISOString().split('T')[0],
      problemStatementUrl: 'https://example.com/nvidia-slr.pdf',
      requirements: 'Python, PyTorch, TensorRT, OpenCV, React'
    },
    {
      id: 'proj-demo-102',
      company: 'Bosch Global',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/16/Bosch-logo.svg',
      title: 'Autonomous AGV Fleet Fleet Telematics Dashboard',
      description: 'Design a unified WebSockets telemetry dashboard monitoring automated guided vehicles on factory floors.',
      budget: '$25,000',
      duration: '6 Months',
      status: 'Pending Assignment',
      targetCampusId: '101',
      dateAdded: new Date().toISOString().split('T')[0],
      problemStatementUrl: 'https://example.com/bosch-agv.pdf',
      requirements: 'React, Node.js, WebSockets, PostgreSQL, Docker'
    }
  ];

  for (const p of defaultProjects) {
    await prisma.project.upsert({
      where: { id: p.id },
      update: p,
      create: p
    });
  }
  console.log('✅ Demo Corporate Projects seeded successfully.');

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
