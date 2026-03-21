const { Client } = require('pg');
require('dotenv').config();

async function checkMigrations() {
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

    const res = await client.query(`SELECT * FROM migrations ORDER BY timestamp DESC`);
    console.log('📋 Applied Migrations:');
    res.rows.forEach(row => console.log(`   - ${row.name} (${row.timestamp})`));

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkMigrations();
