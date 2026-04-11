const { Client } = require('pg');
const client = new Client({ user: 'sms_user', host: 'localhost', database: 'sms_db', password: 'your_secure_password', port: 5432 });
client.connect().then(async () => {
  const tsFriday = await client.query('SELECT "id", "classId", "sectionId", "dayOfWeek" FROM timetables WHERE "dayOfWeek" = 5');
  console.log('Friday timetables globally:', tsFriday.rows);
}).finally(() => client.end());
