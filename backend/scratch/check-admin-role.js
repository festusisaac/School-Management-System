// Quick diagnostic: check what role the admin user has in the database
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 5432,
  user: process.env.DATABASE_USER || 'sms_user',
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'sms_db',
});

async function check() {
  await client.connect();

  // 1. Check the admin user's role string and roleId
  const users = await client.query(`
    SELECT u.id, u.email, u.role, u."roleId", r.name as "roleName"
    FROM users u
    LEFT JOIN roles r ON r.id = u."roleId"
    ORDER BY u."createdAt" ASC
    LIMIT 5
  `);
  console.log('\n=== USERS ===');
  console.table(users.rows);

  // 2. Check all roles
  const roles = await client.query(`SELECT id, name, "isSystem" FROM roles ORDER BY name`);
  console.log('\n=== ROLES ===');
  console.table(roles.rows);

  // 3. Check if Super Administrator role has permissions
  const perms = await client.query(`
    SELECT r.name as "roleName", COUNT(rp."permissionsId") as "permCount"
    FROM roles r
    LEFT JOIN roles_permissions_permissions rp ON rp."rolesId" = r.id
    GROUP BY r.name
    ORDER BY r.name
  `);
  console.log('\n=== ROLE PERMISSION COUNTS ===');
  console.table(perms.rows);

  await client.end();
}

check().catch(console.error);
