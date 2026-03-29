const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

async function reset() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    
    // Get column names to be sure about case sensitivity
    const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'system_settings'");
    const columns = res.rows.map(r => r.column_name);
    console.log('Columns found:', columns);

    const initCol = columns.find(c => c.toLowerCase() === 'isinitialized');
    
    if (initCol) {
        console.log(`Setting "${initCol}" to false...`);
        await client.query(`UPDATE system_settings SET "${initCol}" = false`);
        
        // Clear related data for a clean test
        console.log('Cleaning up academic and user data...');
        await client.query('DELETE FROM academic_terms');
        await client.query('DELETE FROM academic_sessions');
        await client.query('DELETE FROM users');
        
        console.log('SUCCESS: System has been reset. You can now refresh the browser to see the Setup Wizard.');
    } else {
        console.error('ERROR: Could not find isInitialized column in system_settings table.');
    }
  } catch (err) {
    console.error('DATABASE ERROR:', err);
  } finally {
    await client.end();
  }
}

reset();
