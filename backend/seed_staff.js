const { Client } = require('pg');
require('dotenv').config();

async function seedStaff() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  try {
    await client.connect();
    console.log('✅ Connection successful!');

    // 1. Seed Departments
    const depts = [
        { name: 'Academic', code: 'ACAD' },
        { name: 'Administration', code: 'ADMIN' },
        { name: 'Finance', code: 'FIN' }
    ];
    const deptIds = [];
    for (const d of depts) {
        let res = await client.query("SELECT id FROM departments WHERE name = $1", [d.name]);
        if (res.rows.length === 0) {
            console.log(`🌱 Seeding department: ${d.name}`);
            res = await client.query("INSERT INTO departments (name, code, \"isActive\") VALUES ($1, $2, true) RETURNING id", [d.name, d.code]);
        }
        deptIds.push(res.rows[0].id);
    }

    // 2. Seed Designations
    const desigs = ['Principal', 'Teacher', 'Accountant'];
    const desigIds = [];
    for (const d of desigs) {
        let res = await client.query("SELECT id FROM designations WHERE name = $1", [d]);
        if (res.rows.length === 0) {
            console.log(`🌱 Seeding designation: ${d}`);
            res = await client.query("INSERT INTO designations (name, \"isActive\") VALUES ($1, true) RETURNING id", [d]);
        }
        desigIds.push(res.rows[0].id);
    }

    // 3. Seed Staff (Teachers)
    const teachers = [
        { first: 'John', last: 'Doe' },
        { first: 'Jane', last: 'Smith' },
        { first: 'Robert', last: 'Brown' }
    ];

    for (let i = 0; i < teachers.length; i++) {
        const t = teachers[i];
        const email = `${t.first.toLowerCase()}.${t.last.toLowerCase()}@sms.school`;
        const empId = `EMP${100 + i}`;

        const exStaff = await client.query("SELECT id FROM staff WHERE email = $1", [email]);
        if (exStaff.rows.length === 0) {
            console.log(`🌱 Seeding staff: ${t.first} ${t.last}`);
            await client.query(`
                INSERT INTO staff (
                    "employee_id", "first_name", "last_name", "gender", "email", "phone", 
                    "date_of_joining", "department_id", "designation_id", "employment_type", "status", "basic_salary", "is_teaching_staff"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            `, [
                empId, t.first, t.last, 'Male', email, '1234567890', 
                new Date(), deptIds[0], desigIds[1], 'Full-Time', 'Active', 50000, true
            ]);
        }
    }

    console.log('✅ Staff data seeding completed!');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

seedStaff();
