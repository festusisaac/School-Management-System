const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({
        user: 'sms_user',
        host: 'localhost',
        database: 'sms_test_db',
        password: 'sms_password',
        port: 5432,
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        // Check if guardianEmail exists
        const check = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'online_admissions' AND column_name = 'guardianEmail'
        `);

        if (check.rows.length === 0) {
            console.log('Adding guardianEmail column...');
            await client.query('ALTER TABLE online_admissions ADD COLUMN "guardianEmail" varchar');
            
            // Try to copy data from old email column if it exists
            try {
                await client.query('UPDATE online_admissions SET "guardianEmail" = email WHERE email IS NOT NULL');
                console.log('Migrated data from email to guardianEmail');
            } catch (e) {
                console.log('No old email column to migrate from.');
            }
        } else {
            console.log('guardianEmail column already exists.');
        }

        console.log('DB Sync Complete');
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
