const { Client } = require('pg');

const config = {
    host: 'localhost',
    port: 5432,
    user: 'sms_user',
    password: 'your_secure_password',
    database: 'sms_test_db'
};

async function populateSkills() {
    const client = new Client(config);
    await client.connect();

    try {
        console.log('--- Seeding Skills and Attributes for JSS 2 ---');

        // 1. Get Session
        const sessionRes = await client.query('SELECT id FROM academic_sessions WHERE "isActive" = true LIMIT 1');
        if (sessionRes.rows.length === 0) throw new Error('No active academic session found');
        const sessionId = sessionRes.rows[0].id;

        // 2. Get Exam Group to find the tenantId
        const groupRes = await client.query("SELECT id, \"tenantId\" FROM exam_groups WHERE name = 'First Term Examination' LIMIT 1");
        if (groupRes.rows.length === 0) throw new Error('Exam Group First Term Examination not found');
        const { id: examGroupId, tenantId } = groupRes.rows[0];

        // 3. Seed/Get Affective Domains
        const affectiveItems = ['Punctuality', 'Neatness', 'Politeness', 'Honesty', 'Relationship with Others', 'Reliability'];
        const affectiveIds = [];
        for (const name of affectiveItems) {
            let res = await client.query('SELECT id FROM affective_domains WHERE name = $1 AND "tenantId" = $2', [name, tenantId]);
            if (res.rows.length === 0) {
                res = await client.query('INSERT INTO affective_domains (name, "tenantId") VALUES ($1, $2) RETURNING id', [name, tenantId]);
            }
            affectiveIds.push(res.rows[0].id);
        }

        // 3. Seed/Get Psychomotor Domains
        const psychomotorItems = ['Hand Writing', 'Games/Sports', 'Crafts', 'Fluency'];
        const psychomotorIds = [];
        for (const name of psychomotorItems) {
            let res = await client.query('SELECT id FROM psychomotor_domains WHERE name = $1 AND "tenantId" = $2', [name, tenantId]);
            if (res.rows.length === 0) {
                res = await client.query('INSERT INTO psychomotor_domains (name, "tenantId") VALUES ($1, $2) RETURNING id', [name, tenantId]);
            }
            psychomotorIds.push(res.rows[0].id);
        }

        // 5. Get JSS 2 Class
        const classRes = await client.query("SELECT id FROM classes WHERE name = 'JSS 2' AND \"tenantId\" = $1", [tenantId]);
        if (classRes.rows.length === 0) throw new Error('Class JSS 2 not found');
        const classId = classRes.rows[0].id;

        // 5. Get all JSS 2 Students
        const studentsRes = await client.query('SELECT id FROM students WHERE "classId" = $1 AND "tenantId" = $2', [classId, tenantId]);
        const students = studentsRes.rows;
        console.log(`Found ${students.length} students in JSS 2.`);

        // 6. Generate Random Ratings (3 to 5)
        const getRandomRating = () => Math.floor(Math.random() * 3) + 3;

        console.log('Generating ratings...');
        
        let affectiveToInsert = [];
        let psychomotorToInsert = [];

        for (const student of students) {
            // Affective
            for (const domainId of affectiveIds) {
                affectiveToInsert.push({ studentId: student.id, examGroupId, domainId, rating: getRandomRating().toString(), tenantId });
            }
            // Psychomotor
            for (const domainId of psychomotorIds) {
                psychomotorToInsert.push({ studentId: student.id, examGroupId, domainId, rating: getRandomRating().toString(), tenantId });
            }
        }

        // 7. Bulk Insert (Chunked)
        const chunkArray = (array, size) => {
            const chunks = [];
            for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size));
            return chunks;
        };

        const affectiveChunks = chunkArray(affectiveToInsert, 500);
        console.log(`Inserting Affective Ratings (${affectiveToInsert.length} total in ${affectiveChunks.length} chunks)...`);
        for (const chunk of affectiveChunks) {
            const values = [];
            const placeholders = [];
            chunk.forEach((row, i) => {
                const offset = i * 5;
                placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);
                values.push(row.studentId, row.examGroupId, row.domainId, row.rating, row.tenantId);
            });
            await client.query(`INSERT INTO student_skills ("studentId", "examGroupId", "domainId", "rating", "tenantId") VALUES ${placeholders.join(',')}`, values);
        }

        const psychomotorChunks = chunkArray(psychomotorToInsert, 500);
        console.log(`Inserting Psychomotor Ratings (${psychomotorToInsert.length} total in ${psychomotorChunks.length} chunks)...`);
        for (const chunk of psychomotorChunks) {
            const values = [];
            const placeholders = [];
            chunk.forEach((row, i) => {
                const offset = i * 5;
                placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);
                values.push(row.studentId, row.examGroupId, row.domainId, row.rating, row.tenantId);
            });
            await client.query(`INSERT INTO student_psychomotors ("studentId", "examGroupId", "domainId", "rating", "tenantId") VALUES ${placeholders.join(',')}`, values);
        }

        console.log('--- ALL SKILLS AND ATTRIBUTES POPULATED SUCCESSFULLY ---');

    } catch (err) {
        console.error('Error populating skills:', err);
    } finally {
        await client.end();
    }
}

populateSkills();
