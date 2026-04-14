const { Client } = require('pg');
require('dotenv').config();

async function repairRefunds() {
    const client = new Client({
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        // 1. Find all refund transactions with missing sessionId
        const query = `
            SELECT id, meta 
            FROM transactions 
            WHERE type = 'REFUND' AND "sessionId" IS NULL
        `;

        const res = await client.query(query);
        const refundTxns = res.rows;
        console.log(`Found ${refundTxns.length} orphaned refund transactions.`);

        let fixedCount = 0;

        for (const refund of refundTxns) {
            const originalId = refund.meta?.originalTransactionId;
            if (!originalId) {
                console.log(`Refund ${refund.id} is missing originalTransactionId in meta. Skipping.`);
                continue;
            }

            // 2. Find the original transaction to get its session and section IDs
            const originalResult = await client.query(
                'SELECT "sessionId", "schoolSectionId" FROM transactions WHERE id = $1',
                [originalId]
            );

            if (originalResult.rows.length === 0) {
                console.log(`Original transaction ${originalId} not found for refund ${refund.id}. Skipping.`);
                continue;
            }

            const { sessionId, schoolSectionId } = originalResult.rows[0];

            if (!sessionId) {
                console.log(`Original transaction ${originalId} also has no sessionId. Skipping.`);
                continue;
            }

            // 3. Update the refund transaction
            await client.query(
                'UPDATE transactions SET "sessionId" = $1, "schoolSectionId" = $2 WHERE id = $3',
                [sessionId, schoolSectionId, refund.id]
            );

            console.log(`Fixed refund ${refund.id} -> Session ${sessionId}`);
            fixedCount++;
        }

        console.log(`Repair complete. Fixed ${fixedCount} records.`);

    } catch (err) {
        console.error('Error during repair:', err);
    } finally {
        await client.end();
    }
}

repairRefunds();
