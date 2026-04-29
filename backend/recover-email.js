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
        const res = await client.query('SELECT id, "firstName", "guardianEmail" FROM online_admissions ORDER BY "createdAt" DESC LIMIT 1');
        const latest = res.rows[0];
        console.log('Latest Admission:', latest);

        if (latest && !latest.guardianEmail) {
            console.log('Email missing. Fixing it...');
            // Try to find the email from the users table (the super admin's email or something)
            // Or just ask the user. 
            // Actually, I'll just set it to a placeholder if I can't find it, but better: 
            // I'll check if it was stored in the OLD email column.
            
            try {
                const old = await client.query('SELECT email FROM online_admissions WHERE id = $1', [latest.id]);
                if (old.rows[0]?.email) {
                    await client.query('UPDATE online_admissions SET "guardianEmail" = $1 WHERE id = $2', [old.rows[0].email, latest.id]);
                    console.log('Recovered email from old column!');
                }
            } catch (e) {}
        }
    } finally {
        await client.end();
    }
}

run();
