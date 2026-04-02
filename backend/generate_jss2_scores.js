const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function generateScores() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
  });

  const outputDir = path.join(__dirname, 'jss2_scores');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  try {
    await client.connect();
    console.log('Connected to database.');

    // 1. Fetch Students
    const studentRes = await client.query(`
      SELECT s."admissionNo" AS "admission_no"
      FROM students s
      JOIN classes c ON c.id = s."classId"
      WHERE c.name ILIKE '%JSS 2%'
      ORDER BY s."admissionNo" ASC
    `);
    const students = studentRes.rows;
    console.log(`Found ${students.length} students. Sample:`, students[0]);

    // 2. Fetch Subjects
    const subjectRes = await client.query(`
      SELECT s.name
      FROM class_subject cs
      JOIN subjects s ON s.id = cs.subject_id
      JOIN classes c ON c.id = cs.class_id
      WHERE c.name ILIKE '%JSS 2%'
    `);
    const subjects = subjectRes.rows.map(r => r.name);
    console.log(`Found ${subjects.length} subjects.`);

    // 3. Helper for random scores
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // 4. Generate CSV per subject
    for (const subjectName of subjects) {
      const fileName = `JSS2_Scores_${subjectName.replace(/[^a-z0-9]/gi, '_')}.csv`;
      const filePath = path.join(outputDir, fileName);
      
      let csvContent = 'Admission Number,First CA,Second CA,Final Exams\n';
      
      for (const student of students) {
        const firstCA = rand(10, 20);
        const secondCA = rand(10, 20);
        const finalExams = rand(30, 60);
        const admission = student.admission_no || 'UNKNOWN';
        csvContent += `${admission},${firstCA},${secondCA},${finalExams}\n`;
      }

      fs.writeFileSync(filePath, csvContent);
      console.log(`Generated: ${fileName}`);
    }

    console.log('--- Success: All 14 JSS 2 score files generated in /jss2_scores/ ---');

  } catch (err) {
    console.error('Error generating scores:', err.message);
  } finally {
    await client.end();
  }
}

generateScores();
