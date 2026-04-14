
const { Client } = require('pg');
require('dotenv').config();

async function repair() {
    const client = new Client({
        user: process.env.DATABASE_USER || 'sms_user',
        host: process.env.DATABASE_HOST || 'localhost',
        database: process.env.DATABASE_NAME || 'sms_db',
        password: process.env.DATABASE_PASSWORD || 'your_secure_password',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
    });

    try {
        await client.connect();
        console.log('Starting data repair...');

        // 1. Get all sessions
        const resSessions = await client.query('SELECT id, name FROM academic_sessions');
        const sessions = resSessions.rows;

        let totalUpdated = 0;

        for (const session of sessions) {
            console.log(`Linking orphan records for session "${session.name}" (${session.id})...`);
            
            const res = await client.query(
                'UPDATE carry_forwards SET "sessionId" = $1 WHERE "sessionId" IS NULL AND "academicYear" = $2',
                [session.id, session.name]
            );
            
            console.log(`  Updated ${res.rowCount} records.`);
            totalUpdated += res.rowCount;
        }

        console.log(`\nRepair complete. Total records updated: ${totalUpdated}`);

    } catch (err) {
        console.error('Repair failed:', err);
    } finally {
        await client.end();
    }
}

repair();
