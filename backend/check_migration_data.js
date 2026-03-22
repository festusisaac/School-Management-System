const { Client } = require('pg');

async function checkData() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'school_mgmt',
        password: 'admin',
        port: 5432,
    });

    try {
        await client.connect();
        
        console.log('--- Roles ---');
        const rolesRes = await client.query('SELECT id, name FROM roles');
        console.table(rolesRes.rows);

        console.log('\n--- Staff (first 5) ---');
        const staffRes = await client.query('SELECT id, firstName, lastName, role FROM staff LIMIT 5');
        console.table(staffRes.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkData();
