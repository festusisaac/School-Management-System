const { Client } = require('pg');
require('dotenv').config();

async function checkRoles() {
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

    const res = await client.query(`SELECT id, name, "isSystem" FROM roles`);
    console.log('📋 Existing Roles:');
    res.rows.forEach(row => console.log(`   - ${row.name} (isSystem: ${row.isSystem}, id: ${row.id})`));

    const usersRes = await client.query(`SELECT email, role, "roleId" FROM users WHERE email = 'admin@sms.school'`);
    console.log('👤 Admin User:');
    usersRes.rows.forEach(row => console.log(`   - ${row.email}: role='${row.role}', roleId='${row.roleId}'`));

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkRoles();
