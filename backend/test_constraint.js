const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

async function run() {
  const c = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'sms_db'
  });
  
  await c.connect();
  const res = await c.query("SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conname = 'UQ_40490dddbd1095ad68ea36c6be0'");
  console.log('Constraint:', res.rows[0]);
  await c.end();
}

run().catch(console.error);
