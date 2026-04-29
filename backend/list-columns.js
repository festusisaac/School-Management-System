const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({
        user: 'sms_user', host: 'localhost', database: 'sms_test_db', password: 'sms_password', port: 5432,
    });

    try {
        await client.connect();
        const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'online_admissions'");
        console.log('Columns in online_admissions:', res.rows.map(r => r.column_name));
    } finally {
        await client.end();
    }
}

run();
