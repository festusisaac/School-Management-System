
const { Client } = require('pg');

async function syncTenantIds() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'sms_user',
        password: 'your_secure_password',
        database: 'sms_db'
    });

    try {
        await client.connect();
        
        console.log('Fetching students with mismatched tenantIds...');
        
        console.log('Syncing staff tenantIds via email...');
        const staffSync = await client.query(`
            UPDATE staff s
            SET "tenantId" = u."tenantId"
            FROM users u
            WHERE s.email = u.email AND s."tenantId"::text != u."tenantId"::text
        `);
        console.log(`Updated ${staffSync.rowCount} staff records.`);
        
        console.log('Syncing parent tenantIds via userId...');
        const parentSync = await client.query(`
            UPDATE parents p
            SET "tenantId" = u."tenantId"
            FROM users u
            WHERE p."userId"::uuid = u.id AND p."tenantId"::text != u."tenantId"::text
        `);
        console.log(`Updated ${parentSync.rowCount} parent records.`);
        
        console.log('Synchronization complete.');
        
    } catch (err) {
        console.error('Error during synchronization:', err);
    } finally {
        await client.end();
    }
}

syncTenantIds();
