const { Client } = require('pg');

async function checkFees() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'sms_user',
        password: 'your_secure_password',
        database: 'sms_db',
    });

    try {
        await client.connect();

        // 1. Find Hector's Class
        const studentRes = await client.query('SELECT id, "classId" FROM student WHERE "admissionNo" = $1', ['PHJC/2025/004']);
        const student = studentRes.rows[0];

        if (!student) {
            console.log('Student not found');
            return;
        }

        console.log('Student:', student);

        // 2. Find assignments for both student and class
        const assignmentsRes = await client.query(`
      SELECT a.id, a."studentId", a."classId", a.session, g.name as group_name, a.source 
      FROM fee_assignment a 
      JOIN fee_group g ON a."feeGroupId" = g.id 
      WHERE (a."studentId" = $1 OR a."classId" = $2) AND a."isActive" = true
    `, [student.id, student.classId]);

        console.log('Assignments Found:', assignmentsRes.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkFees();
