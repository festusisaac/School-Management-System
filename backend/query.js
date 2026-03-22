const { Client } = require('pg');
const client = new Client({
  user: 'sms_user',
  host: 'localhost',
  database: 'sms_db',
  password: 'your_secure_password',
  port: 5432,
});

client.connect().then(() => {
  return client.query(
    'SELECT u.email, u."firstName", u.role, s."admissionNo" FROM users u JOIN students s ON s."userId" = u.id::varchar ORDER BY u."createdAt" DESC LIMIT 5;'
  );
}).then(res => {
  console.table(res.rows);
  client.end();
}).catch(err => {
  console.error(err);
  client.end();
});
