const { Client } = require('pg');
require('dotenv').config();

async function check() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  try {
    await client.connect();
    const roleRes = await client.query("SELECT id, name, permissions FROM roles WHERE name = 'Student'");
    console.log('ROLE:', roleRes.rows[0]);
    await client.end();
  } catch (err) {
    console.error(err);
  }
}

check();
