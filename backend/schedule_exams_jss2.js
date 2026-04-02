const { Client } = require('pg');
require('dotenv').config();

async function scheduleExams() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    // 1. Find JSS 2 Class
    const classRes = await client.query("SELECT id, \"tenantId\" FROM classes WHERE name ILIKE '%JSS 2%' LIMIT 1");
    if (classRes.rows.length === 0) {
      console.error('Error: JSS 2 class not found.');
      return;
    }
    const classId = classRes.rows[0].id;
    const tenantId = classRes.rows[0].tenantId;

    // 2. Find Exam Group
    const groupRes = await client.query("SELECT id FROM exam_groups WHERE name ILIKE '%First Term Examination%' AND \"tenantId\" = $1 LIMIT 1", [tenantId]);
    if (groupRes.rows.length === 0) {
      console.error('Error: "First Term Examination" group not found.');
      return;
    }
    const examGroupId = groupRes.rows[0].id;

    // 3. Get all subjects assigned to JSS 2
    const subjectRes = await client.query(`
      SELECT s.id, s.name, cs.session_id 
      FROM class_subject cs
      JOIN subjects s ON s.id = cs.subject_id
      WHERE cs.class_id = $1 AND cs.tenant_id = $2
    `, [classId, tenantId]);

    if (subjectRes.rows.length === 0) {
      console.error('Error: No subjects found assigned to JSS 2.');
      return;
    }

    console.log(`Found ${subjectRes.rows.length} subjects for JSS 2.`);

    // 4. Schedule logic
    // Start date: Monday April 6th, 2026
    let currentDate = new Date('2026-04-06');
    let sessionCount = 0; // 0 = Morning, 1 = Afternoon

    for (const sub of subjectRes.rows) {
      // Create Exam record
      const examName = `${sub.name} - JSS 2`;
      const examInsert = await client.query(`
        INSERT INTO exams (id, name, "examGroupId", "subjectId", "classId", "sessionId", "tenantId", "totalMarks", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 100, NOW(), NOW())
        RETURNING id
      `, [examName, examGroupId, sub.id, classId, sub.session_id, tenantId]);
      
      const examId = examInsert.rows[0].id;

      // Define times
      const startTime = sessionCount === 0 ? '09:00:00' : '13:00:00';
      const endTime = sessionCount === 0 ? '11:00:00' : '15:00:00';

      // Create ExamSchedule record
      await client.query(`
        INSERT INTO exam_schedules (id, "examId", date, "startTime", "endTime", venue, "tenantId", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, 'School Hall', $5, NOW(), NOW())
      `, [examId, currentDate.toISOString().split('T')[0], startTime, endTime, tenantId]);

      console.log(`Scheduled: ${examName} on ${currentDate.toISOString().split('T')[0]} @ ${startTime}`);

      // Increment counters
      sessionCount++;
      if (sessionCount > 1) {
        sessionCount = 0;
        // Move to next weekday
        currentDate.setDate(currentDate.getDate() + 1);
        // Skip weekends (if Sat/Sun)
        if (currentDate.getDay() === 6) currentDate.setDate(currentDate.getDate() + 2); // Sat -> Mon
        if (currentDate.getDay() === 0) currentDate.setDate(currentDate.getDate() + 1); // Sun -> Mon
      }
    }

    console.log('--- Success: All exams scheduled for JSS 2 ---');

  } catch (err) {
    console.error('Error scheduling exams:', err.message);
  } finally {
    await client.end();
  }
}

scheduleExams();
