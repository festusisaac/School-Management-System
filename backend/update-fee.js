const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'sms_user',
  password: 'sms_password',
  database: 'sms_test_db',
});

async function run() {
  await client.connect();
  const res = await client.query('UPDATE fee_assignments SET "updatedAt" = NOW()');
  console.log(`Updated ${res.rowCount} fee assignments`);
  await client.end();
}

run().catch(console.error);
