const { Client } = require('pg');
require('dotenv').config();

async function checkCounts() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  try {
    await client.connect();
    console.log('✅ Connection successful!');

    const tables = ['users', 'classes', 'sections', 'subjects', 'staff_members', 'students'];
    for (const table of tables) {
        const res = await client.query(`SELECT count(*) FROM "${table}"`);
        console.log(`Table ${table}: ${res.rows[0].count} rows`);
    }

    const classes = await client.query('SELECT * FROM classes LIMIT 1');
    if (classes.rows.length > 0) {
        console.log('Sample Class:', classes.rows[0]);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkCounts();
