const { Client } = require('pg');
require('dotenv').config();

async function seedAcademics() {
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

    // 1. Get or Create Academic Session
    let sessionRes = await client.query("SELECT id FROM academic_sessions WHERE \"isActive\" = true LIMIT 1");
    let sessionId;
    if (sessionRes.rows.length === 0) {
        console.log('🌱 Seeding academic session...');
        const res = await client.query(`
            INSERT INTO academic_sessions (name, "startDate", "endDate", "isActive")
            VALUES ('2025/2026', '2025-09-01', '2026-07-31', true)
            RETURNING id
        `);
        sessionId = res.rows[0].id;
    } else {
        sessionId = sessionRes.rows[0].id;
    }

    // 2. Get or Create Academic Term
    let termRes = await client.query("SELECT id FROM academic_terms WHERE \"isActive\" = true LIMIT 1");
    if (termRes.rows.length === 0) {
        console.log('🌱 Seeding academic term...');
        await client.query(`
            INSERT INTO academic_terms (name, "sessionId", "startDate", "endDate", "isActive")
            VALUES ('First Term', $1, '2025-09-01', '2025-12-20', true)
        `, [sessionId]);
    }

    // 3. Seed Classes and Sections
    const classes = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];
    const sections = ['A', 'B', 'C'];

    for (const className of classes) {
        // Check if class exists
        const exClass = await client.query("SELECT id FROM classes WHERE name = $1", [className]);
        let classId;
        if (exClass.rows.length === 0) {
            console.log(`🌱 Seeding class: ${className}`);
            const res = await client.query("INSERT INTO classes (name, \"isActive\") VALUES ($1, true) RETURNING id", [className]);
            classId = res.rows[0].id;
        } else {
            classId = exClass.rows[0].id;
        }

        for (const sectionName of sections) {
            const exSection = await client.query("SELECT id FROM sections WHERE name = $1 AND \"classId\" = $2", [sectionName, classId]);
            if (exSection.rows.length === 0) {
                console.log(`   🌱 Seeding section: ${sectionName} for ${className}`);
                await client.query("INSERT INTO sections (name, \"classId\", \"isActive\") VALUES ($1, $2, true)", [sectionName, classId]);
            }
        }
    }

    // 4. Seed Subjects
    const subjects = ['Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'Economics'];
    for (const subName of subjects) {
        const exSub = await client.query("SELECT id FROM subjects WHERE name = $1", [subName]);
        if (exSub.rows.length === 0) {
            console.log(`🌱 Seeding subject: ${subName}`);
            await client.query("INSERT INTO subjects (name, \"isCore\", \"isActive\") VALUES ($1, true, true)", [subName]);
        }
    }

    console.log('✅ Academic data seeding completed!');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

seedAcademics();
