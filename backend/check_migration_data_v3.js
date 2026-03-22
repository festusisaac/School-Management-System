const { Client } = require('pg');

async function checkData() {
    const client = new Client({
        user: 'sms_user',
        host: 'localhost',
        database: 'sms_db',
        password: 'your_secure_password',
        port: 5432,
    });

    try {
        await client.connect();
        
        console.log('--- Roles ---');
        const rolesRes = await client.query('SELECT id, name FROM roles');
        console.table(rolesRes.rows);

        console.log('\n--- Staff (first 10) ---');
        const staffRes = await client.query('SELECT id, "firstName", "lastName", role, role_id FROM staff LIMIT 10');
        console.table(staffRes.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkData();
