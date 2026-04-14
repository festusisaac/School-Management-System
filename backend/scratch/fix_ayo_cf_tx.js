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

    // Find transaction by reference
    const result = await c.query(`
        SELECT id, type, amount, "sessionId", reference
        FROM transactions
        WHERE reference = 'CF-TO-2026/2027'
    `);
    console.log('CF transaction:', result.rows);

    if (result.rows.length === 0) {
        console.log('Not found by reference. Trying by type ADJUSTMENT...');
        const res2 = await c.query(`
            SELECT id, type, amount, "sessionId", reference
            FROM transactions
            WHERE "studentId" = '0bc98791-4eeb-435e-9286-ee4bd4e8ba58' AND type = 'ADJUSTMENT'
        `);
        console.log('ADJUSTMENT transactions:', res2.rows);

        if (res2.rows.length > 0) {
            const SESSION_2026 = '58307ac3-c104-4c92-9693-16daf0586e3a';
            const ids = res2.rows.filter(r => r.sessionId !== SESSION_2026).map(r => r.id);
            if (ids.length > 0) {
                const upd = await c.query(`UPDATE transactions SET "sessionId" = $1 WHERE id = ANY($2::uuid[]) RETURNING id, "sessionId"`, [SESSION_2026, ids]);
                console.log('Updated:', upd.rows);
            } else {
                console.log('All ADJUSTMENT transactions already in 2026/2027 session.');
            }
        }
    } else {
        const SESSION_2026 = '58307ac3-c104-4c92-9693-16daf0586e3a';
        const ids = result.rows.filter(r => r.sessionId !== SESSION_2026).map(r => r.id);
        if (ids.length > 0) {
            const upd = await c.query(`UPDATE transactions SET "sessionId" = $1 WHERE id = ANY($2::uuid[]) RETURNING id, "sessionId"`, [SESSION_2026, ids]);
            console.log('Updated:', upd.rows);
        } else {
            console.log('Already in correct session:', result.rows);
        }
    }

    await c.end();
}
run().catch(console.error);
