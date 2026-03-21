const { Client } = require('pg');
require('dotenv').config();

async function dropDesignation() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  try {
    await client.connect();
    console.log('✅ Connection successful!');

    console.log('🗑️ Dropping column staff.designation_id...');
    await client.query(`ALTER TABLE "staff" DROP COLUMN IF EXISTS "designation_id" CASCADE`);
    
    console.log('🗑️ Dropping table designations...');
    await client.query(`DROP TABLE IF EXISTS "designations" CASCADE`);

    console.log('✅ Changes applied successfully!');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

dropDesignation();
