const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'sms_user',
  password: 'your_secure_password',
  database: 'sms_db'
});

async function fix() {
  try {
    await client.connect();
    
    console.log('Adding userId column to parents table...');
    await client.query('ALTER TABLE "parents" ADD COLUMN IF NOT EXISTS "userId" uuid');
    
    console.log('Recording migration in migrations table...');
    const migrationName = 'AddParentUserIdAndSeedRoles1774140710975';
    const timestamp = 1774140710975;
    
    // Check if migration table exists
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'migrations'");
    if (res.rows.length > 0) {
        await client.query('INSERT INTO migrations(timestamp, name) VALUES($1, $2) ON CONFLICT DO NOTHING', [timestamp, migrationName]);
    }
    
    console.log('✅ Done!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

fix();
