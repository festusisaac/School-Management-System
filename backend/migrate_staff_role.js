const { Client } = require('pg');

async function migrate() {
    const client = new Client({
        user: 'sms_user',
        host: 'localhost',
        database: 'sms_db',
        password: 'your_secure_password',
        port: 5432,
    });

    try {
        await client.connect();
        console.log('Connected to database');

        // 1. Add role_id column if it doesn't exist
        console.log('Adding role_id column to staff table...');
        await client.query(`
            ALTER TABLE staff 
            ADD COLUMN IF NOT EXISTS role_id UUID;
        `);

        // 2. Fetch all roles
        const rolesRes = await client.query('SELECT id, name FROM roles');
        const rolesMap = {};
        rolesRes.rows.forEach(r => {
            rolesMap[r.name.toLowerCase()] = r.id;
        });
        console.log('Available roles:', Object.keys(rolesMap));

        // 3. Update staff role_id based on role string
        console.log('Migrating existing role strings to role_id...');
        const staffRes = await client.query('SELECT id, role FROM staff WHERE role IS NOT NULL');
        
        for (const row of staffRes.rows) {
            const roleName = row.role.toLowerCase();
            const roleId = rolesMap[roleName];
            
            if (roleId) {
                await client.query('UPDATE staff SET role_id = $1 WHERE id = $2', [roleId, row.id]);
                console.log(`Updated staff ${row.id} with role ${row.role} -> ${roleId}`);
            } else {
                console.warn(`No matching role found for "${row.role}" (Staff ID: ${row.id})`);
            }
        }

        console.log('Migration completed successfully');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
