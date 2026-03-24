
const { Client } = require('pg');

async function adoptSeedData() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'sms_user',
        password: 'your_secure_password',
        database: 'sms_db'
    });

    try {
        await client.connect();
        
        const legacyTenantId = '00000000-0000-0000-0000-000000000001';
        const targetTenantId = '186f9f4d-1298-4a99-b35a-1494d9f581a1';
        
        console.log(`Adopting all seed data from ${legacyTenantId} to ${targetTenantId}...`);
        
        const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const allTables = tablesRes.rows.map(r => r.table_name);
        
        for (const table of allTables) {
            // Check if table has tenantId column
            const colsRes = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1 AND column_name = 'tenantId'
            `, [table]);
            
            if (colsRes.rows.length > 0) {
                console.log(`Updating table: ${table}...`);
                const res = await client.query(`
                    UPDATE ${table}
                    SET "tenantId" = $1
                    WHERE "tenantId"::text = $2
                `, [targetTenantId, legacyTenantId]);
                console.log(`Updated ${res.rowCount} records in ${table}.`);
            }
        }
        
        console.log('Adoption complete.');
        
    } catch (err) {
        console.error('Error during adoption:', err);
    } finally {
        await client.end();
    }
}

adoptSeedData();
