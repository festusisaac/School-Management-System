const { Client } = require('pg');
const client = new Client({
  user: 'sms_user',
  host: 'localhost',
  database: 'sms_db',
  password: 'your_secure_password',
  port: 5432,
});
client.connect()
  .then(async () => {
    console.log('--- Database Summary ---');
    
    const studentsCount = await client.query('SELECT COUNT(*) FROM students');
    console.log('Total Students:', studentsCount.rows[0].count);
    
    const assignedStudents = await client.query('SELECT COUNT(*) FROM students WHERE "classId" IS NOT NULL');
    console.log('Students with assigned Class:', assignedStudents.rows[0].count);
    
    const timetableCount = await client.query('SELECT COUNT(*) FROM timetables');
    console.log('Timetable Slots:', timetableCount.rows[0].count);
    
    const classes = await client.query('SELECT id, name FROM classes');
    console.log('Classes:', JSON.stringify(classes.rows, null, 2));

    if (parseInt(timetableCount.rows[0].count) > 0) {
        const sampleSlots = await client.query('SELECT id, "classId", "dayOfWeek" FROM timetables LIMIT 3');
        console.log('Sample Slots:', JSON.stringify(sampleSlots.rows, null, 2));
    }

    await client.end();
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
