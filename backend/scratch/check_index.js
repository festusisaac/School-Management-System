const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const c = new Client({
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME
    });
    await c.connect();

    const res = await c.query("SELECT indexdef FROM pg_indexes WHERE indexname = 'IDX_fa6ab79055f72f20e478b6d93a'");
    console.log(res.rows[0]);

    await c.end();
}
run().catch(console.error);
