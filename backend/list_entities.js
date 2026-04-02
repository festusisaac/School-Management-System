const { Client } = require('pg');
require('dotenv').config();

async function listAll() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
  });

  try {
    await client.connect();
    console.log('--- DATABASE ENTITIES ---');

    const classes = await client.query("SELECT id, name, \"tenantId\" FROM classes");
    console.log('\nCLASSES:');
    classes.rows.forEach(r => console.log(` - ${r.name} (ID: ${r.id}, Tenant: ${r.tenantId})`));

    const sessions = await client.query("SELECT id, name, \"isCurrent\" FROM academic_sessions");
    console.log('\nSESSIONS:');
    sessions.rows.forEach(r => console.log(` - ${r.name} (ID: ${r.id}, Current: ${r.isCurrent})`));

    const groups = await client.query("SELECT id, name FROM subject_groups");
    console.log('\nSUBJECT GROUPS:');
    groups.rows.forEach(r => console.log(` - ${r.name} (ID: ${r.id})`));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

listAll();
