/**
 * Mongo → PostgreSQL Migration Utility
 * APNILEAP Production Database Migration
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runMigration() {
  console.log('=== STARTING APNILEAP MONGODB -> POSTGRESQL MIGRATION ===');
  
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('FATAL: MONGODB_URI environment variable is missing.');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('FATAL: DATABASE_URL environment variable is missing.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected successfully.');

  const db = mongoose.connection.db;

  const report = {
    collectionsProcessed: [],
    details: {}
  };

  function initReport(collName) {
    report.details[collName] = {
      mongoCount: 0,
      postgresInsertedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      relationshipFailures: 0,
      duplicateRecords: 0,
      errors: []
    };
  }

  try {
    // 1. Migrate Users
    initReport('users');
    const mongoUsers = await db.collection('users').find({}).toArray();
    report.details.users.mongoCount = mongoUsers.length;
    console.log(`Migrating ${mongoUsers.length} Users...`);

    for (const u of mongoUsers) {
      try {
        const id = u._id.toString();
        const existing = await prisma.user.findUnique({ where: { email: u.email } });
        if (existing) {
          report.details.users.duplicateRecords++;
          report.details.users.skippedCount++;
          continue;
        }

        await prisma.user.create({
          data: {
            id: id,
            email: u.email,
            password: u.password || 'default_hashed_pass',
            displayName: u.displayName || u.name || 'User',
            role: u.role || 'STUDENT',
            persona: u.persona || 'student',
            spokeId: u.spokeId || null,
            status: u.status || 'APPROVED',
            createdAt: u.createdAt ? new Date(u.createdAt) : new Date()
          }
        });
        report.details.users.postgresInsertedCount++;
      } catch (err) {
        report.details.users.failedCount++;
        const errorMsg = `Mongo User ID ${u._id}: ${err.message}`;
        report.details.users.errors.push(errorMsg);
        console.error('FAIL LOUDLY [User]:', errorMsg);
      }
    }

    // 2. Migrate Projects (CorporateProjects)
    initReport('corporateprojects');
    const mongoProjects = await db.collection('corporateprojects').find({}).toArray();
    report.details.corporateprojects.mongoCount = mongoProjects.length;
    console.log(`Migrating ${mongoProjects.length} CorporateProjects...`);

    for (const p of mongoProjects) {
      try {
        const pId = p._id.toString();
        const existing = await prisma.project.findUnique({ where: { id: pId } });
        if (existing) {
          report.details.corporateprojects.duplicateRecords++;
          report.details.corporateprojects.skippedCount++;
          continue;
        }

        const projectData = {
          id: pId,
          company: p.company || 'Unknown Company',
          logoUrl: p.logoUrl || '',
          title: p.title || 'Untitled Project',
          description: p.description || '',
          budget: String(p.budget || '0'),
          duration: String(p.duration || 'N/A'),
          status: p.status || 'Pending Assignment',
          assignedTo: p.assignedTo || null,
          targetCampusId: p.targetCampusId || null,
          proposedDueDate: p.proposedDueDate || '',
          assignedKey: p.assignedKey || null,
          facultyMentor: p.facultyMentor ? JSON.parse(JSON.stringify(p.facultyMentor)) : null,
          projectMentor: p.projectMentor ? JSON.parse(JSON.stringify(p.projectMentor)) : null,
          dateAdded: p.dateAdded || new Date().toISOString().split('T')[0],
          problemStatementUrl: p.problemStatementUrl || '',
          requirements: p.requirements || '',
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date()
        };

        await prisma.project.create({ data: projectData });
        report.details.corporateprojects.postgresInsertedCount++;

        // Migrate nested phases
        if (Array.isArray(p.phases)) {
          let order = 1;
          for (const phase of p.phases) {
            await prisma.projectPhase.create({
              data: {
                projectId: pId,
                name: phase.name || `Phase ${order}`,
                description: phase.description || '',
                order: order++
              }
            });
          }
        }

        // Migrate nested allocations
        if (Array.isArray(p.allocations)) {
          for (const alloc of p.allocations) {
            const allocId = alloc._id ? alloc._id.toString() : undefined;
            await prisma.allocation.create({
              data: {
                id: allocId,
                projectId: pId,
                targetCampusId: alloc.targetCampusId || '101',
                assignedTo: alloc.assignedTo || 'Unassigned',
                status: alloc.status || 'Proposed',
                proposedDueDate: alloc.proposedDueDate || '',
                assignedKey: alloc.assignedKey || null,
                facultyMentor: alloc.facultyMentor ? JSON.parse(JSON.stringify(alloc.facultyMentor)) : null,
                projectMentor: alloc.projectMentor ? JSON.parse(JSON.stringify(alloc.projectMentor)) : null
              }
            });
          }
        }
      } catch (err) {
        report.details.corporateprojects.failedCount++;
        const errorMsg = `Mongo CorporateProject ID ${p._id}: ${err.message}`;
        report.details.corporateprojects.errors.push(errorMsg);
        console.error('FAIL LOUDLY [CorporateProject]:', errorMsg);
      }
    }

    // 3. Migrate Teams
    initReport('teams');
    const mongoTeams = await db.collection('teams').find({}).toArray();
    report.details.teams.mongoCount = mongoTeams.length;
    console.log(`Migrating ${mongoTeams.length} Teams...`);

    for (const t of mongoTeams) {
      try {
        const teamId = t._id.toString();
        const existing = await prisma.team.findUnique({ where: { id: teamId } });
        if (existing) {
          report.details.teams.duplicateRecords++;
          report.details.teams.skippedCount++;
          continue;
        }

        await prisma.team.create({
          data: {
            id: teamId,
            name: t.name,
            boardId: t.boardId || null,
            mentor: t.mentor ? JSON.parse(JSON.stringify(t.mentor)) : null,
            teamLeader: t.teamLeader ? JSON.parse(JSON.stringify(t.teamLeader)) : null,
            subMentor: t.subMentor ? JSON.parse(JSON.stringify(t.subMentor)) : null,
            projectId: t.projectId || null,
            githubRepo: t.githubRepo || '',
            finalProgress: t.finalProgress ? JSON.parse(JSON.stringify(t.finalProgress)) : null,
            members: t.members ? JSON.parse(JSON.stringify(t.members)) : null,
            createdAt: t.createdAt ? new Date(t.createdAt) : new Date()
          }
        });
        report.details.teams.postgresInsertedCount++;
      } catch (err) {
        report.details.teams.failedCount++;
        const errorMsg = `Mongo Team ID ${t._id}: ${err.message}`;
        report.details.teams.errors.push(errorMsg);
        console.error('FAIL LOUDLY [Team]:', errorMsg);
      }
    }

    // 4. Migrate Submissions
    initReport('submissions');
    const mongoSubmissions = await db.collection('submissions').find({}).toArray();
    report.details.submissions.mongoCount = mongoSubmissions.length;
    console.log(`Migrating ${mongoSubmissions.length} Submissions...`);

    for (const s of mongoSubmissions) {
      try {
        const subId = s._id.toString();
        const existing = await prisma.submission.findUnique({ where: { id: subId } });
        if (existing) {
          report.details.submissions.duplicateRecords++;
          report.details.submissions.skippedCount++;
          continue;
        }

        await prisma.submission.create({
          data: {
            id: subId,
            taskId: s.taskId,
            studentName: s.studentName,
            fileName: s.fileName,
            fileUrl: s.fileUrl,
            comments: s.comments || '',
            status: s.status || 'Awaiting Review',
            feedback: s.feedback || '',
            grade: s.grade || '',
            version: s.version || 1,
            submittedAt: s.submittedAt ? new Date(s.submittedAt) : new Date()
          }
        });
        report.details.submissions.postgresInsertedCount++;

        if (Array.isArray(s.reworkHistory)) {
          for (const item of s.reworkHistory) {
            await prisma.reworkHistory.create({
              data: {
                submissionId: subId,
                version: item.version || 1,
                fileName: item.fileName || s.fileName,
                fileUrl: item.fileUrl || s.fileUrl,
                status: item.status || 'Re-work Requested',
                feedback: item.feedback || '',
                comments: item.comments || '',
                timestamp: item.timestamp ? new Date(item.timestamp) : new Date()
              }
            });
          }
        }
      } catch (err) {
        report.details.submissions.failedCount++;
        const errorMsg = `Mongo Submission ID ${s._id}: ${err.message}`;
        report.details.submissions.errors.push(errorMsg);
        console.error('FAIL LOUDLY [Submission]:', errorMsg);
      }
    }

    // 5. Migrate Meetings
    initReport('meetings');
    const mongoMeetings = await db.collection('meetings').find({}).toArray();
    report.details.meetings.mongoCount = mongoMeetings.length;
    console.log(`Migrating ${mongoMeetings.length} Meetings...`);

    for (const m of mongoMeetings) {
      try {
        const mId = m.id || m._id.toString();
        const existing = await prisma.meeting.findUnique({ where: { id: mId } });
        if (existing) {
          report.details.meetings.duplicateRecords++;
          report.details.meetings.skippedCount++;
          continue;
        }

        // Ensure campus exists or create placeholder campus
        let campusId = m.campusId || '101';
        let campus = await prisma.campus.findUnique({ where: { id: campusId } });
        if (!campus) {
          campus = await prisma.campus.create({
            data: { id: campusId, name: `Campus ${campusId}` }
          });
        }

        await prisma.meeting.create({
          data: {
            id: mId,
            title: m.title || 'General Sync',
            campusId: campus.id,
            date: m.date || new Date().toISOString().split('T')[0],
            time: m.time || '10:00 AM',
            link: m.link || '',
            agenda: m.agenda || '',
            cadenceType: m.cadenceType || 'General Sync',
            meetingNotes: m.meetingNotes || '',
            notesPostedAt: m.notesPostedAt ? new Date(m.notesPostedAt) : null,
            reminderSentAt: m.reminderSentAt ? new Date(m.reminderSentAt) : null
          }
        });
        report.details.meetings.postgresInsertedCount++;

        if (Array.isArray(m.actionItems)) {
          for (const ai of m.actionItems) {
            await prisma.meetingActionItem.create({
              data: {
                meetingId: mId,
                summary: ai.summary || 'Action Item',
                jiraKey: ai.jiraKey || null,
                status: ai.status || 'Created',
                createdAt: ai.createdAt ? new Date(ai.createdAt) : new Date()
              }
            });
          }
        }
      } catch (err) {
        report.details.meetings.failedCount++;
        const errorMsg = `Mongo Meeting ID ${m._id || m.id}: ${err.message}`;
        report.details.meetings.errors.push(errorMsg);
        console.error('FAIL LOUDLY [Meeting]:', errorMsg);
      }
    }

    // 6. Migrate ChatMessages
    initReport('chatmessages');
    const mongoChats = await db.collection('chatmessages').find({}).toArray();
    report.details.chatmessages.mongoCount = mongoChats.length;
    console.log(`Migrating ${mongoChats.length} ChatMessages...`);

    for (const c of mongoChats) {
      try {
        const chatId = c._id.toString();
        await prisma.chatMessage.create({
          data: {
            id: chatId,
            sender: c.sender || 'Anonymous',
            message: c.message || '',
            campus: c.campus || 'General',
            createdAt: c.createdAt ? new Date(c.createdAt) : new Date()
          }
        });
        report.details.chatmessages.postgresInsertedCount++;
      } catch (err) {
        report.details.chatmessages.failedCount++;
        const errorMsg = `Mongo ChatMessage ID ${c._id}: ${err.message}`;
        report.details.chatmessages.errors.push(errorMsg);
        console.error('FAIL LOUDLY [ChatMessage]:', errorMsg);
      }
    }

    console.log('\n=== MIGRATION REPORT SUMMARY ===');
    console.table(Object.keys(report.details).map(k => ({
      Collection: k,
      MongoCount: report.details[k].mongoCount,
      PostgresInserted: report.details[k].postgresInsertedCount,
      Skipped: report.details[k].skippedCount,
      Failed: report.details[k].failedCount,
      Duplicates: report.details[k].duplicateRecords
    })));

    let hasErrors = false;
    for (const k of Object.keys(report.details)) {
      if (report.details[k].failedCount > 0) {
        hasErrors = true;
        console.error(`Collection ${k} had ${report.details[k].failedCount} failures:`, report.details[k].errors);
      }
    }

    if (hasErrors) {
      console.error('\n MIGRATION COMPLETED WITH FAILURES. REVIEW LOGS ABOVE.');
    } else {
      console.log('\n MIGRATION COMPLETED SUCCESSFULLY WITH ZERO FAILURES.');
    }

  } catch (error) {
    console.error('CRITICAL MIGRATION ERROR:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    await prisma.$disconnect();
  }
}

runMigration();
