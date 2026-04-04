const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function auditSections() {
    const client = new Client({
        user: process.env.DATABASE_USER,
        host: process.env.DATABASE_HOST,
        database: process.env.DATABASE_NAME,
        password: process.env.DATABASE_PASSWORD,
        port: process.env.DATABASE_PORT,
    });

    try {
        await client.connect();
        
        console.log('--- SECTIONS ---');
        const sectionsRes = await client.query('SELECT id, name FROM school_sections');
        console.log(JSON.stringify(sectionsRes.rows, null, 2));

        console.log('--- CLASSES PER SECTION ---');
        const classesRes = await client.query('SELECT id, name, "schoolSectionId" FROM classes');
        console.log(JSON.stringify(classesRes.rows, null, 2));

        console.log('--- STUDENT TOTALS ---');
        const studentRes = await client.query('SELECT COUNT(*) FROM students');
        console.log('Total Students in DB:', studentRes.rows[0].count);

        console.log('--- STUDENT DISTRIBUTION BY CLASS ID ---');
        const studentDist = await client.query('SELECT "classId", COUNT(*) FROM students GROUP BY "classId"');
        console.log(JSON.stringify(studentDist.rows, null, 2));

        await client.end();
    } catch (e) {
        console.error(e.message);
    }
}

auditSections();
