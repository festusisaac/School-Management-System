const { Client } = require('pg');
require('dotenv').config();

async function convertRoleToVarchar() {
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

    // 1. Alter column type to varchar
    console.log('🔄 Converting users.role to varchar...');
    await client.query(`ALTER TABLE users ALTER COLUMN role TYPE varchar`);
    
    // 2. Drop the enum type
    console.log('🗑️ Dropping users_role_enum...');
    await client.query(`DROP TYPE IF EXISTS users_role_enum`);

    // 3. Get Super Administrator role ID
    const roleRes = await client.query(`SELECT id FROM roles WHERE name = 'Super Administrator'`);
    if (roleRes.rows.length === 0) {
        throw new Error('Super Administrator role not found in database!');
    }
    const superAdminRoleId = roleRes.rows[0].id;

    // 4. Update admin account
    console.log('🆙 Elevating admin@sms.school to Super Administrator...');
    await client.query(`
        UPDATE users 
        SET role = 'super administrator', 
            "roleId" = $1, 
            "tenantId" = NULL 
        WHERE email = 'admin@sms.school'
    `, [superAdminRoleId]);

    console.log('✅ Changes applied successfully!');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

convertRoleToVarchar();
