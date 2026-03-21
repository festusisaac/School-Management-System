const { Client } = require('pg');
require('dotenv').config();

async function checkAdmin() {
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

    const res = await client.query(`SELECT email, role, "tenantId" FROM users WHERE email = 'admin@sms.school'`);
    if (res.rows.length === 0) {
        console.log('⚠️ Admin user NOT found!');
    } else {
        console.log('📋 Admin User Details:');
        console.log(JSON.stringify(res.rows[0], null, 2));
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkAdmin();
