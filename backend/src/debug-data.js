const { Client } = require('pg');
require('dotenv').config();

async function debugData() {
    const client = new Client({
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        user: process.env.DATABASE_USER || 'sms_user',
        password: process.env.DATABASE_PASSWORD || 'your_secure_password',
        database: process.env.DATABASE_NAME || 'sms_db'
    });

    try {
        await client.connect();
        
        console.log('\n--- DEBUG: ROLES ---');
        const roles = await client.query('SELECT id, name FROM roles');
        console.table(roles.rows);

        console.log('\n--- DEBUG: CLASSES ---');
        const classes = await client.query('SELECT name, "tenantId" FROM classes LIMIT 5');
        console.table(classes.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

debugData();
