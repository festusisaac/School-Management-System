const { Client } = require('pg');
require('dotenv').config();

async function fix() {
    const client = new Client({
        user: 'sms_user',
        host: 'localhost',
        database: 'sms_test_db',
        password: 'sms_password',
        port: 5432,
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        // 1. Find the correct tenant ID (the one that has the classes)
        const classResult = await client.query('SELECT "tenantId" FROM classes LIMIT 1');
        const correctTenantId = classResult.rows[0]?.tenantId;

        if (!correctTenantId) {
            console.log('No classes found. Cannot determine correct tenant.');
            return;
        }
        console.log(`Correct Tenant ID: ${correctTenantId}`);

        // 2. Find admissions that are NOT in the correct tenant
        const badAdmissions = await client.query('SELECT id, "firstName", "lastName", "tenantId" FROM online_admissions WHERE "tenantId" != $1', [correctTenantId]);
        
        if (badAdmissions.rows.length === 0) {
            console.log('No misplaced admissions found.');
            return;
        }

        console.log(`Found ${badAdmissions.rows.length} misplaced admissions. Moving them...`);

        // 3. Move them to the correct tenant
        const updateResult = await client.query('UPDATE online_admissions SET "tenantId" = $1 WHERE "tenantId" != $1', [correctTenantId]);
        
        console.log(`Successfully moved ${updateResult.rowCount} admissions to the correct school account!`);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

fix();
