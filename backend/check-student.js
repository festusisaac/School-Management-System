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
  const res = await client.query(`
    SELECT s.id, s."firstName", s."lastName", s."discountProfileId", dp.name as discount_name
    FROM students s
    LEFT JOIN discount_profiles dp ON s."discountProfileId" = dp.id
    WHERE s."firstName" ILIKE '%Festus%'
  `);
  console.log(res.rows);
  
  const rules = await client.query(`
    SELECT * FROM discount_rules
  `);
  console.log('Rules:', rules.rows);
  
  await client.end();
}

run().catch(console.error);
