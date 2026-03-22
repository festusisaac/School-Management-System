const { Client } = require('pg');

async function checkSchema() {
    const client = new Client({
        user: 'sms_user',
        host: 'localhost',
        database: 'sms_db',
        password: 'your_secure_password',
        port: 5432,
    });

    try {
        await client.connect();
        
        console.log('--- Staff Table Columns ---');
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'staff'
        `);
        console.table(res.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkSchema();
