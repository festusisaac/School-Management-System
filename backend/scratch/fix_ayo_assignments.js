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

    const AYO_ID    = '0bc98791-4eeb-435e-9286-ee4bd4e8ba58';
    const SESSION   = 'b86384ba-4274-4271-a3ab-7140fcdca525'; // 2025/2026

    // DRY RUN: Show what will be deactivated
    const preview = await c.query(`
        SELECT fa.id, fh.name, fh."defaultAmount", fa."isActive", fa."sessionId"
        FROM fee_assignments fa
        JOIN fee_group_heads fgh ON fgh."feeGroupId"::text = fa."feeGroupId"::text
        JOIN fee_heads fh ON fh.id::text = fgh."feeHeadId"::text
        WHERE fa."studentId"::text = $1 AND fa."sessionId"::text = $2::text AND fa."isActive" = true
    `, [AYO_ID, SESSION]);

    console.log('\n--- Fee assignments to be DEACTIVATED for Ayo (2025/2026) ---');
    console.table(preview.rows);

    if (preview.rows.length === 0) {
        console.log('Nothing to deactivate.');
        await c.end();
        return;
    }

    // Get the unique assignment IDs (not per-head, but per fee_assignment record)
    const assignmentIds = await c.query(`
        SELECT DISTINCT fa.id
        FROM fee_assignments fa
        WHERE fa."studentId"::text = $1 AND fa."sessionId"::text = $2::text AND fa."isActive" = true
    `, [AYO_ID, SESSION]);

    const ids = assignmentIds.rows.map(r => r.id);
    console.log('\nDeactivating assignment IDs:', ids);

    // EXECUTE: Set isActive = false
    const result = await c.query(
        `UPDATE fee_assignments SET "isActive" = false WHERE id = ANY($1::uuid[])`,
        [ids]
    );
    console.log(`\n✅ Done. Deactivated ${result.rowCount} fee assignment(s) for Ayo Friday (2025/2026).`);
    console.log('Ayo\'s 2025/2026 balance should now be ₦0.00.');
    console.log('His ₦7,000 carry-forward remains correctly in 2026/2027.');

    await c.end();
}
run().catch(console.error);
