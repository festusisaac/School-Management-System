const { Client } = require('pg');
require('dotenv').config();

async function check() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    user: process.env.DATABASE_USER || 'sms_user',
    password: process.env.DATABASE_PASSWORD || 'your_secure_password',
    database: process.env.DATABASE_NAME || 'sms_db',
  });

  try {
    await client.connect();
    const res = await client.query('SELECT name FROM roles');
    console.log('Roles in database:', res.rows.map(r => r.name));
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();
