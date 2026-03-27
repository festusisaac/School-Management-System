const { Client } = require('pg');

async function findExpired() {
  const client = new Client({
    user: 'sms_user',
    host: 'localhost',
    database: 'sms_db',
    password: 'your_secure_password',
    port: 5432,
  });

  try {
    await client.connect();
    const res = await client.query('SELECT title, "endTime", status FROM online_classes WHERE "endTime" < NOW()');
    console.log('Expired Classes:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

findExpired();
