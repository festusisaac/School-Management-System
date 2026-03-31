const { Client } = require('pg');

async function run() {
  const client = new Client({
    user: 'sms_user',
    host: 'localhost',
    database: 'sms_db',
    password: 'your_secure_password',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    // 1. Get Super Administrator Role
    const roleRes = await client.query("SELECT id FROM roles WHERE name = 'Super Administrator'");
    if (roleRes.rows.length === 0) {
      console.error('Super Administrator role not found!');
      return;
    }
    const roleId = roleRes.rows[0].id;

    // 2. Get All Permissions
    const permRes = await client.query('SELECT id FROM permissions');
    const allPerms = permRes.rows;
    console.log(`Found ${allPerms.length} total permissions.`);

    // 3. Clear existing role_permissions
    await client.query('DELETE FROM role_permissions WHERE "roleId" = $1', [roleId]);

    // 4. Insert all permissions
    const insertValues = allPerms.map(p => `('${roleId}', '${p.id}')`).join(', ');
    const query = `INSERT INTO role_permissions ("roleId", "permissionId") VALUES ${insertValues} ON CONFLICT DO NOTHING`;
    
    await client.query(query);
    console.log(`Successfully synced all ${allPerms.length} permissions to Super Administrator.`);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
