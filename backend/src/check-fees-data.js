
const { Client } = require('pg');

async function checkFeesData() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'sms_user',
        password: 'your_secure_password',
        database: 'sms_db'
    });

    try {
        await client.connect();
        
        console.log('--- Users in Real Tenants ---');
        const realUsers = await client.query(`
            SELECT email, role, "tenantId" 
            FROM users 
            WHERE "tenantId"::text != '00000000-0000-0000-0000-000000000001'
        `);
        console.log(realUsers.rows);
        
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkFeesData();
