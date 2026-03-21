const { Client } = require('pg');
require('dotenv').config();

async function listPermissions() {
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

    const res = await client.query(`SELECT module, name, slug FROM permissions ORDER BY module, name`);
    console.log('📋 Existing Permissions:');
    res.rows.forEach(row => console.log(`   [${row.module}] ${row.name} (${row.slug})`));

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

listPermissions();
