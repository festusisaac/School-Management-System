const { Client } = require('pg');
require('dotenv').config();

async function checkData() {
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

    // 1. Check roles in users table
    const rolesRes = await client.query('SELECT role, count(*) FROM users GROUP BY role');
    console.log('📊 Roles in users table:');
    rolesRes.rows.forEach(row => console.log(`   - ${row.role}: ${row.count}`));

    // 2. Check tenantId distribution in users
    const userTenantsRes = await client.query('SELECT "tenantId", count(*) FROM users GROUP BY "tenantId"');
    console.log('📊 TenantId in users table:');
    userTenantsRes.rows.forEach(row => console.log(`   - ${row.tenantId}: ${row.count}`));

    // 3. Check classes and their tenantId
    const classesRes = await client.query('SELECT "tenantId", count(*) FROM classes GROUP BY "tenantId"');
    console.log('📊 TenantId in classes table:');
    classesRes.rows.forEach(row => console.log(`   - ${row.tenantId}: ${row.count}`));

    // 4. Check sections and their tenantId
    const sectionsRes = await client.query('SELECT "tenantId", count(*) FROM sections GROUP BY "tenantId"');
    console.log('📊 TenantId in sections table:');
    sectionsRes.rows.forEach(row => console.log(`   - ${row.tenantId}: ${row.count}`));

    // 5. Check the current user's role and tenantId (assume admin@sms.school is logged in)
    const adminRes = await client.query("SELECT email, role, \"tenantId\" FROM users WHERE email = 'admin@sms.school'");
    console.log('👤 admin@sms.school:', adminRes.rows[0]);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkData();
