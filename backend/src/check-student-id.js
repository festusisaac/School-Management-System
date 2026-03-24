
const { Client } = require('pg');

async function checkStudent() {
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
            JOIN users u ON s."userId" = u.id
            WHERE s."tenantId"::text != u."tenantId"::text
        `);
        console.log('Mismatched Records:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkStudent();
