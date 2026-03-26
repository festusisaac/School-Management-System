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
  const res = await c.query("SELECT conname FROM pg_constraint WHERE conrelid = 'staff'::regclass AND contype = 'u'");
  console.log('Constraints:', res.rows);
  
  for (const row of res.rows) {
      if (row.conname.startsWith('UQ_')) {
          console.log(`Dropping constraint: ${row.conname}`);
          await c.query(`ALTER TABLE staff DROP CONSTRAINT "${row.conname}"`);
      }
  }
  
  await c.end();
}

run().catch(console.error);
