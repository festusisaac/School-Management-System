const { Client } = require('pg');
const client = new Client({ user: 'sms_user', host: 'localhost', database: 'sms_db', password: 'your_secure_password', port: 5432 });

async function run() {
  await client.connect();
  const studentId = '0bc98791-4eeb-435e-9286-ee4bd4e8ba58';
  const classId = '81b2800b-5140-4623-a157-c26fbdb28935';
  const now = new Date();
  
  // 1. Performance Trend
  const trend = await client.query(`
    SELECT r."averageScore" as score, eg.name as term, r."createdAt"
    FROM student_term_results r
    JOIN exam_groups eg ON eg.id = r."examGroupId"
    WHERE r."studentId" = $1 AND eg."isPublished" = true
    ORDER BY r."createdAt" ASC
    LIMIT 4
  `, [studentId]);
  console.log('Trend:', trend.rows);

  // 2. Pending Assignments
  const homework = await client.query(`
    SELECT h.id, h.title, h."dueDate" as "dueDate", s.name as subject
    FROM homework h
    JOIN subjects s ON s.id = h."subjectId"
    LEFT JOIN homework_submissions sub ON sub."homeworkId" = h.id AND sub."studentId" = $1
    WHERE h."classId" = $2 
      AND (sub.id IS NULL OR sub.status = 'PENDING')
      AND h."dueDate" >= $3
    ORDER BY h."dueDate" ASC
    LIMIT 4
  `, [studentId, classId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)]);
  console.log('Homework:', homework.rows);

  // 3. Live Classes
  const live = await client.query(`
    SELECT oc.id, oc.title, oc."meetingUrl", oc.platform, oc."startTime", s.name as subject
    FROM online_classes oc
    JOIN subjects s ON s.id = oc."subjectId"
    WHERE oc."classId" = $2 
      AND oc.status IN ('SCHEDULED', 'IN_PROGRESS')
      AND oc."startTime" <= $3
      AND oc."endTime" >= $4
  `, [studentId, classId, new Date(Date.now() + 15 * 60 * 1000), new Date(Date.now() - 60 * 60 * 1000)]);
  console.log('Live Classes:', live.rows);

  await client.end();
}

run().catch(console.error);
