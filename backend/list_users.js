const { Client } = require('pg');
require('dotenv').config();

async function listUsers() {
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

    const res = await client.query(`SELECT id, email, role, "roleId", "tenantId" FROM users LIMIT 10`);
    console.log('📋 Existing Users:');
    res.rows.forEach(row => console.log(`   - ${row.email}: role='${row.role}', roleId='${row.roleId}', tenantId='${row.tenantId}'`));

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

listUsers();
