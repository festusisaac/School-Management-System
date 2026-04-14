const { Client } = require('pg');
require('dotenv').config();

async function checkTime() {
    const client = new Client({
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
    });

    try {
        await client.connect();
        const res = await client.query('SELECT "id", "createdAt" FROM transactions ORDER BY "createdAt" DESC LIMIT 1');
        console.log('Latest Transaction:', res.rows[0]);
        const tzRes = await client.query('SHOW TIMEZONE');
        console.log('Postgres Timezone:', tzRes.rows[0]);
        const nowRes = await client.query('SELECT NOW()');
        console.log('Postgres NOW():', nowRes.rows[0]);
        const colRes = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'createdAt'");
        console.log('Column Info:', colRes.rows[0]);
        console.log('System Time (JS):', new Date().toString());
        console.log('System Time (ISO):', new Date().toISOString());
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkTime();
