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

    const AYO_ID = '0bc98791-4eeb-435e-9286-ee4bd4e8ba58';

    // Show ALL transactions for Ayo - no type filter
    const allTx = await c.query(`
        SELECT id, type, amount, "sessionId", reference, meta, "createdAt"
        FROM transactions
        WHERE "studentId" = $1
        ORDER BY "createdAt" DESC
    `, [AYO_ID]);
    console.log('\nAll transactions for Ayo:');
    console.table(allTx.rows.map(r => ({
        id: r.id.substring(0,8),
        type: r.type,
        amount: r.amount,
        sessionId: r.sessionId?.substring(0,8),
        reference: r.reference,
        createdAt: r.createdAt
    })));

    // Check valid enum values
    const enumVals = await c.query(`
        SELECT enumlabel FROM pg_enum 
        JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
        WHERE pg_type.typname = 'transactions_type_enum'
    `);
    console.log('\nValid type enum values:', enumVals.rows.map(r => r.enumlabel));

    await c.end();
}
run().catch(console.error);
