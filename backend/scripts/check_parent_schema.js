const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'sms_user',
  password: 'your_secure_password',
  database: 'sms_db'
});

async function check() {
  try {
    await client.connect();
    const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'parents' AND column_name = 'userId'");
    console.log(res.rows.length > 0 ? 'exists' : 'missing');
    
    // Also check for designators table to see if it still exists
    const res2 = await client.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'designations'");
    console.log('Designations table:', res2.rows.length > 0 ? 'exists' : 'missing');
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

check();
