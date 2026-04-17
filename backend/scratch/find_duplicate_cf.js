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
    
    // Find duplicated carry_forwards
    const result = await c.query(`
        SELECT "studentId", "feeHeadId", "sessionId", COUNT(*)
        FROM carry_forwards
        GROUP BY "studentId", "feeHeadId", "sessionId"
        HAVING COUNT(*) > 1
    `);
    
    console.log(`Found ${result.rowCount} duplicated groups:`);
    console.table(result.rows);

    if (result.rowCount > 0) {
        // Output detailed duplicated rows
        for (const row of result.rows) {
            const detailRes = await c.query(`
                SELECT id, "amount", "academicYear", "createdAt" 
                FROM carry_forwards 
                WHERE "studentId" = $1 AND "feeHeadId" = $2 AND "sessionId" = $3
                ORDER BY "createdAt" ASC
            `, [row.studentId, row.feeHeadId, row.sessionId]);
            
            console.log(`\nDetails for student ${row.studentId}, head ${row.feeHeadId}:`);
            console.table(detailRes.rows);
        }
    }

    await c.end();
}
run().catch(console.error);
