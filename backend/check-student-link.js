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
    const userRes = await client.query("SELECT id, email, role, \"tenantId\" FROM users WHERE id = 'be3069c8-64e5-4a77-a290-85ec1559472a'");
    console.log('USER:', userRes.rows[0]);
    
    const studentRes = await client.query("SELECT id, \"userId\", \"firstName\", \"lastName\", \"tenantId\" FROM students WHERE \"userId\" = 'be3069c8-64e5-4a77-a290-85ec1559472a'");
    console.log('STUDENT (by userId):', studentRes.rows[0]);
    
    const studentPKRes = await client.query("SELECT id, \"userId\", \"firstName\", \"lastName\", \"tenantId\" FROM students WHERE id = 'be3069c8-64e5-4a77-a290-85ec1559472a'");
    console.log('STUDENT (by id):', studentPKRes.rows[0]);
    
    await client.end();
  } catch (err) {
    console.error(err);
  }
}

check();
