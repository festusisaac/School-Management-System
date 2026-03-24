
const { Client } = require('pg');

async function syncAllStudentData() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'sms_user',
        password: 'your_secure_password',
        database: 'sms_db'
    });

    try {
        await client.connect();
        
        console.log('Starting comprehensive student data tenant synchronization...');
        
        console.log('Fetching all table names...');
        const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const allTables = tablesRes.rows.map(r => r.table_name);
        console.log('Available tables:', allTables);

        // Filter for potential tables linked by studentId
        const tablesToSync = [
            'fee_assignments',
            'transactions',
            'attendance',
            'student_attendance',
            'student_exams',
            'exam_scores',
            'exam_marks',
            'exam_psychomotor',
            'exam_skills',
            'scratch_cards',
            'student_documents',
            'student_leaves',
            'student_notes'
        ].filter(t => allTables.includes(t));
        
        console.log('Tables identified for synchronization:', tablesToSync);
        
        for (const table of tablesToSync) {
            console.log(`Checking columns for: ${table}...`);
            const colsRes = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1 AND column_name = 'studentId'
            `, [table]);
            
            if (colsRes.rows.length === 0) {
                console.log(`Skipping ${table}: No studentId column found.`);
                continue;
            }

            console.log(`Syncing table: ${table}...`);
            const res = await client.query(`
                UPDATE ${table}
                SET "tenantId" = s."tenantId"
                FROM students s
                WHERE ${table}."studentId" = s.id AND ${table}."tenantId"::text != s."tenantId"::text
            `);
            console.log(`Updated ${res.rowCount} records in ${table}.`);
        }
        
        console.log('Synchronization complete.');
        
    } catch (err) {
        console.error('Error during synchronization:', err);
    } finally {
        await client.end();
    }
}

syncAllStudentData();
