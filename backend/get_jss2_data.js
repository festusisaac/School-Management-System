const { Client } = require('pg');
require('dotenv').config();

async function getData() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
  });

  try {
    await client.connect();
    const studentRes = await client.query(`
      SELECT count(*) 
      FROM students s 
      JOIN classes c ON c.id = s."classId" 
      WHERE c.name ILIKE '%JSS 2%'
    `);
    const subjectRes = await client.query(`
      SELECT s.name 
      FROM class_subject cs 
      JOIN subjects s ON s.id = cs.subject_id 
      JOIN classes c ON c.id = cs.class_id 
      WHERE c.name ILIKE '%JSS 2%'
    `);

    console.log('JSS 2 Student Count:', studentRes.rows[0].count);
    console.log('JSS 2 Subjects:', subjectRes.rows.map(r => r.name));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

getData();
