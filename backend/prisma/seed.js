/**
 * PostgreSQL Prisma Seed Script for APNILEAP
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Comprehensive APNILEAP PostgreSQL Seeding...');

  // 1. Seed Campuses
  const campuses = [
    { id: '101', name: 'Hub Campus (AK)', jiraBoardKey: 'AK', jiraBoardId: '101', jiraProjectKey: 'AK' },
    { id: '3', name: 'RIT Spoke Campus (APNN)', jiraBoardKey: 'APNN', jiraBoardId: '3', jiraProjectKey: 'PNLP' },
    { id: '102', name: 'MMCOEP Campus', jiraBoardKey: 'CAMPB', jiraBoardId: '102', jiraProjectKey: 'CAMPB' },
    { id: '103', name: 'COEP Campus', jiraBoardKey: 'CAMPC', jiraBoardId: '103', jiraProjectKey: 'CAMPC' }
  ];

  for (const c of campuses) {
    await prisma.campus.upsert({
      where: { id: c.id },
      update: c,
      create: c
    });
  }
  console.log('✅ Campuses seeded successfully.');

  // 2. Seed Default Users across all Personas & Roles
  const defaultPassword = await bcrypt.hash('Password123!', 10);
  const adminPassword = await bcrypt.hash('Admin@12345', 10);

  const users = [
    {
      email: 'admin@apnileap.com',
      password: adminPassword,
      displayName: 'Central Admin',
      role: 'ADMIN',
      persona: 'moderator',
      status: 'APPROVED',
      campusId: '101'
    },
    {
      email: 'moderator@apnileap.com',
      password: defaultPassword,
      displayName: 'State FIP Moderator',
      role: 'MODERATOR',
      persona: 'moderator',
      status: 'APPROVED',
      campusId: '101'
    },
    {
      email: 'student@rit.edu',
      password: defaultPassword,
      displayName: 'Rahul Sharma',
      role: 'STUDENT',
      persona: 'student',
      status: 'APPROVED',
      campusId: '3'
    },
    {
      email: 'faculty@rit.edu',
      password: defaultPassword,
      displayName: 'Dr. Suresh Patil',
      role: 'FACULTY_MENTOR',
      persona: 'faculty',
      status: 'APPROVED',
      campusId: '3'
    },
    {
      email: 'mentor@bosch.com',
      password: defaultPassword,
      displayName: 'Aniket Verma',
      role: 'PROJECT_MENTOR',
      persona: 'mentor',
      status: 'APPROVED',
      campusId: '101'
    },
    {
      email: 'exec@nvidia.com',
      password: defaultPassword,
      displayName: 'Priya Nair',
      role: 'EXECUTIVE',
      persona: 'executive',
      status: 'APPROVED',
      campusId: '101'
    }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        displayName: u.displayName,
        role: u.role,
        persona: u.persona,
        status: u.status,
        campusId: u.campusId
      },
      create: u
    });
  }
  console.log(`✅ Default Users (${users.length}) seeded/verified successfully.`);

  // 3. Seed Corporate Projects
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
      title: 'Autonomous AGV Telematics Dashboard',
      description: 'Design a unified WebSockets telemetry dashboard monitoring automated guided vehicles on factory floors in real-time.',
      budget: '$25,000',
      duration: '6 Months',
      status: 'Pending Assignment',
      targetCampusId: '101',
      dateAdded: new Date().toISOString().split('T')[0],
      problemStatementUrl: 'https://example.com/bosch-agv.pdf',
      requirements: 'React, Node.js, WebSockets, PostgreSQL, Docker'
    },
    {
      id: 'proj-demo-103',
      company: 'TATA Motors',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Tata_logo.svg',
      title: 'EV Battery Thermal Runway AI Diagnostic',
      description: 'Predictive machine learning algorithm for early detection of lithium-ion cell thermal degradation in electric bus fleets.',
      budget: '$30,000',
      duration: '4 Months',
      status: 'Accepted',
      targetCampusId: '102',
      dateAdded: new Date().toISOString().split('T')[0],
      problemStatementUrl: 'https://example.com/tata-ev.pdf',
      requirements: 'Python, Scikit-Learn, Fast-API, InfluxDB'
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

  // 4. Seed Meetings
  const defaultMeetings = [
    {
      id: 'meet-101',
      title: 'KLE FIP Campus Sprint Sync',
      campusId: '3',
      date: '2026-05-27',
      time: '14:30',
      meetingLink: 'https://meet.jit.si/Rovo-Sync-kle-sprint',
      agenda: 'Sprint blocker escalation, VLSI laboratory setup progression, and Phase 1 milestone evaluation.',
      cadenceType: 'Weekly College PM Update'
    },
    {
      id: 'meet-102',
      title: 'Sponsor Executive Review (NVIDIA)',
      campusId: '101',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '11:00',
      meetingLink: 'https://zoom.us/j/demo-sponsor-nvidia',
      agenda: 'Ingested Automotive MCU architecture review, budget allocation check, and student delegation status.',
      cadenceType: 'Monthly FIP Steering Review'
    }
  ];

  for (const m of defaultMeetings) {
    await prisma.meeting.upsert({
      where: { id: m.id },
      update: m,
      create: m
    });
  }
  console.log('✅ Default Meetings seeded successfully.');

  // 5. Seed Chat Messages
  const chatCount = await prisma.chatMessage.count();
  if (chatCount === 0) {
    const defaultMessages = [
      { sender: 'Rahul Sharma (RIT Campus)', message: 'Phase 1 lab equipment setup completed! Ready for mentor review.', campus: 'RIT Campus' },
      { sender: 'Sneha Joshi (COEP Campus)', message: 'Awesome Rahul! We just pushed our micro-controller architecture specs on board AK-21.', campus: 'COEP Campus' },
      { sender: 'Nikhil Rane (MMCOEP Campus)', message: 'RIT Campus guys, did you finalize the pest detection model training? Need the API key.', campus: 'MMCOEP Campus' }
    ];
    for (const msg of defaultMessages) {
      await prisma.chatMessage.create({ data: msg });
    }
    console.log('✅ Chat Messages seeded successfully.');
  }

  console.log('🌱 Comprehensive Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
