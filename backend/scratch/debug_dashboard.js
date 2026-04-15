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

    // Check all transaction types and counts
    const r = await c.query("SELECT type, COUNT(*) as count FROM transactions GROUP BY type ORDER BY count DESC");
    console.log('\nTransaction types in DB:');
    console.table(r.rows);

    // Check specifically for ADJUSTMENT
    const adj = await c.query("SELECT id, amount, reference, meta FROM transactions WHERE type = 'ADJUSTMENT' LIMIT 10");
    console.log(`\nADJUSTMENT transactions: ${adj.rowCount}`);
    if (adj.rows.length > 0) console.table(adj.rows);

    await c.end();
}
run().catch(console.error);
