const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({
        user: 'sms_user', host: 'localhost', database: 'sms_test_db', password: 'sms_password', port: 5432,
    });

    try {
        await client.connect();
        await client.query('UPDATE online_admissions SET "guardianEmail" = $1 WHERE "firstName" = $2', ['isaacleo101@gmail.com', 'Dominic']);
        console.log('Successfully patched Dominic\'s email!');
    } finally {
        await client.end();
    }
}

run();
