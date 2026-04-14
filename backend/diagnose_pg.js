
const { Client } = require('pg');
require('dotenv').config();

async function check() {
    const client = new Client({
        user: process.env.DATABASE_USER || 'sms_user',
        host: process.env.DATABASE_HOST || 'localhost',
        database: process.env.DATABASE_NAME || 'sms_db',
        password: process.env.DATABASE_PASSWORD || 'your_secure_password',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
    });

    try {
        await client.connect();
        
        console.log('--- Academic Sessions ---');
        const resSessions = await client.query('SELECT id, name FROM academic_sessions');
        console.table(resSessions.rows);

        console.log('\n--- Recent Carry Forwards ---');
        const resCf = await client.query('SELECT id, "studentId", "sessionId", amount, "academicYear" FROM carry_forwards ORDER BY "createdAt" DESC LIMIT 10');
        console.table(resCf.rows);

        console.log('\n--- Student IDs for Lara and Friday ---');
        const resStud = await client.query('SELECT id, "firstName", "lastName" FROM students WHERE "firstName" IN (\'Joy\', \'Ayo\')');
        console.table(resStud.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

check();
