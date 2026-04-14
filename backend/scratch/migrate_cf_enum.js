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

    // Verify CARRY_FORWARD is in the enum
    const enumVals = await c.query(`
        SELECT enumlabel FROM pg_enum 
        JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
        WHERE pg_type.typname = 'transactions_type_enum'
        ORDER BY enumsortorder
    `);
    console.log('Current enum values:', enumVals.rows.map(r => r.enumlabel));

    // Migrate all ADJUSTMENT transactions that are carry-forward transfers
    const result = await c.query(`
        UPDATE transactions 
        SET type = 'CARRY_FORWARD'
        WHERE reference LIKE 'CF-TO-%' AND type = 'ADJUSTMENT'
        RETURNING id, type, reference, "sessionId"
    `);
    console.log(`\n✅ Migrated ${result.rowCount} transaction(s) to CARRY_FORWARD type:`);
    console.table(result.rows);

    await c.end();
}
run().catch(console.error);
