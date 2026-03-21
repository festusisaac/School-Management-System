const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
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

    // Check users table schema
    const schemaRes = await client.query(`
        SELECT column_name, data_type, udt_name, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
    `);
    console.log('📋 Users Table Schema:');
    schemaRes.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type} (${row.udt_name}), nullable: ${row.is_nullable}`);
    });

    // Check actual roles in users table
    const rolesCountRes = await client.query('SELECT role, count(*) FROM users GROUP BY role');
    console.log('📊 Roles in users table:');
    rolesCountRes.rows.forEach(row => {
        console.log(`   - ${row.role}: ${row.count}`);
    });

    // Check the admin user specifically
    const adminRes = await client.query("SELECT email, role, \"tenantId\" FROM users WHERE email = 'admin@sms.school'");
    if (adminRes.rows.length > 0) {
        console.log('👤 Admin user:', adminRes.rows[0]);
    } else {
        console.log('❌ Admin user not found');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

testConnection();
