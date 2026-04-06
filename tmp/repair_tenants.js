const { Client } = require('pg');

async function checkMismatches() {
    const client = new Client({
        user: 'sms_user',
        host: 'localhost',
        database: 'sms_db',
        password: 'your_secure_password',
        port: 5432,
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT 
                u.id as user_id, 
                u.email, 
                u."tenantId" as user_tenant, 
                s.id as student_id, 
                s."tenantId" as student_tenant
            FROM users u
            JOIN students s ON s."userId" = u.id
            WHERE u."tenantId" != s."tenantId";
        `);

        console.log('Mismatched Records Found:', res.rows.length);
        console.log(JSON.stringify(res.rows, null, 2));
        
        if (res.rows.length > 0) {
            console.log('\nRepairing...');
            const updateRes = await client.query(`
                UPDATE users u
                SET "tenantId" = s."tenantId"
                FROM students s
                WHERE s."userId" = u.id
                AND u."tenantId" != s."tenantId";
            `);
            console.log('Repaired Records:', updateRes.rowCount);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkMismatches();
