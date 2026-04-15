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

    console.log("Cleaning up duplicate carry forwards...");
    
    // Use CTID to keep the one with the highest CTID (typically latest inserted)
    // or by checking createdAt if we want to be safe.
    // The easiest way in Postgres to delete duplicates:
    const delRes = await c.query(`
        DELETE FROM carry_forwards
        WHERE id IN (
            SELECT id
            FROM (
                SELECT id,
                ROW_NUMBER() OVER( PARTITION BY "studentId", "feeHeadId", "sessionId" ORDER BY "createdAt" DESC, id ) as row_num
                FROM carry_forwards
            ) t
            WHERE t.row_num > 1
        )
        RETURNING id
    `);
    
    console.log(`Deleted ${delRes.rowCount} duplicate carry-forward records.`);
    
    // Also let's clean up any single carryForward clear transactions that might be duplicated by looking for Duplicate Meta carryForwardId?
    // Actually, no. Since the error was that the insert of the transaction failed due to unique key, there are NO duplicate transactions!
    // The second transaction failed to insert, throwing the 500 error, leaving the duplicate carryForward orphan.
    // So cleaning carry_forwards is alone sufficient.

    await c.end();
}
run().catch(console.error);
