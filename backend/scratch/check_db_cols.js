const { Client } = require('pg');
require('dotenv').config();

async function checkColumns() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const tables = ['transactions', 'exam_results', 'student_attendance', 'staff_attendance'];
    for (const table of tables) {
      console.log(`\nColumns for table: ${table}`);
      const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [table]);
      res.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type})`);
      });
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkColumns();
