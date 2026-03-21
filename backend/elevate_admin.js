const { Client } = require('pg');
require('dotenv').config();

async function elevateAdmin() {
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

    // 1. Get Super Administrator role ID
    const roleRes = await client.query(`SELECT id FROM roles WHERE name = 'Super Administrator'`);
    if (roleRes.rows.length === 0) {
        throw new Error('Super Administrator role not found in database!');
    }
    const superAdminRoleId = roleRes.rows[0].id;
    console.log(`ℹ️ Super Admin Role ID: ${superAdminRoleId}`);

    // 2. Update admin@sms.school
    console.log('🆙 Elevating admin@sms.school...');
    const updateRes = await client.query(`
        UPDATE users 
        SET role = 'super administrator', 
            "roleId" = $1, 
            "tenantId" = NULL 
        WHERE email = 'admin@sms.school'
        RETURNING id, email, role, "tenantId"
    `, [superAdminRoleId]);

    if (updateRes.rows.length > 0) {
        console.log('✅ Admin elevated successfully:');
        console.log(JSON.stringify(updateRes.rows[0], null, 2));
    } else {
        console.log('⚠️ admin@sms.school not found, no changes made.');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

elevateAdmin();
