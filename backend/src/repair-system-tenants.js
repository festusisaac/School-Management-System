const { Client } = require('pg');
require('dotenv').config();

async function repairTenants() {
    const client = new Client({
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        user: process.env.DATABASE_USER || 'sms_user',
        password: process.env.DATABASE_PASSWORD || 'your_secure_password',
        database: process.env.DATABASE_NAME || 'sms_db'
    });

    try {
        await client.connect();
        
        console.log('--- System-Wide Tenant Repair Start ---');

        // 1. Fix Users from Students
        console.log('Fixing student-linked users...');
        const userStudentFix = await client.query(`
            UPDATE "users" u
            SET "tenantId" = s."tenantId"::uuid
            FROM "students" s
            WHERE s."userId"::text = u."id"::text
            AND u."tenantId"::text != s."tenantId"::text
        `);
        console.log(`✓ Updated ${userStudentFix.rowCount} users linked to students.`);

        // 2. Fix Users from Parents
        console.log('Fixing parent-linked users...');
        const userParentFix = await client.query(`
            UPDATE "users" u
            SET "tenantId" = p."tenantId"::uuid
            FROM "parents" p
            WHERE p."userId"::text = u."id"::text
            AND u."tenantId"::text != p."tenantId"::text
        `);
        console.log(`✓ Updated ${userParentFix.rowCount} users linked to parents.`);

        // 3. Fix Sub-tables (Attendance, Fees, etc.)
        const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const allTables = tablesRes.rows.map(r => r.table_name);
        
        const tablesToSync = [
            'fee_assignments', 'transactions', 'attendance', 'student_attendance',
            'student_exams', 'exam_scores', 'exam_marks', 'exam_psychomotor',
            'exam_skills', 'scratch_cards', 'student_documents', 'student_leaves', 'student_notes'
        ].filter(t => allTables.includes(t));

        for (const table of tablesToSync) {
            const colsRes = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1 AND column_name = 'studentId'
            `, [table]);
            
            if (colsRes.rows.length > 0) {
                const res = await client.query(`
                    UPDATE ${table}
                    SET "tenantId" = s."tenantId"
                    FROM students s
                    WHERE ${table}."studentId" = s.id AND ${table}."tenantId"::text != s."tenantId"::text
                `);
                if (res.rowCount > 0) console.log(`✓ Synchronized ${res.rowCount} records in ${table}.`);
            }
        }

        console.log('--- Repair Complete ---');
        
    } catch (err) {
        console.error('Error during repair:', err);
    } finally {
        await client.end();
    }
}

repairTenants();
