
const { Client } = require('pg');

async function verifySync() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'sms_user',
        password: 'your_secure_password',
        database: 'sms_db'
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT s.id, s."firstName", s."lastName", s."tenantId"::text as student_tenant, u."tenantId"::text as user_tenant 
            FROM students s
            JOIN users u ON s."userId"::uuid = u.id
            WHERE u.id::text = $1
        `, ['be3069c8-64e5-4a77-a290-85ec1559472a']);
        console.log('Verification Results:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

verifySync();
