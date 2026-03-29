import { DataSource, Between } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'sms_user',
  password: process.env.DATABASE_PASSWORD || 'sms_password',
  database: process.env.DATABASE_NAME || 'sms_db',
  schema: 'public'
});

async function verifyAttendance() {
    try {
        await AppDataSource.initialize();
        console.log('✓ Database connected for attendance verification');

        // 1. Find a student
        const student = await AppDataSource.query('SELECT id, "classId", "sectionId" FROM "students" LIMIT 1');
        if (student.length === 0) {
            console.log('! No students found to test.');
            return;
        }
        const sid = student[0].id;
        const cid = student[0].classId;
        const secId = student[0].sectionId;

        // 2. Identify two distinct session IDs
        const sess = await AppDataSource.query('SELECT id, name FROM "academic_sessions" LIMIT 2');
        if (sess.length < 2) {
             console.log('! Need two sessions to test.');
             return;
        }

        const sessA = sess[0].id;
        const sessB = sess[1].id;

        // 3. Clear existing attendance for these specific dates to be safe
        await AppDataSource.query('DELETE FROM "student_attendance" WHERE "studentId" = $1 AND date IN ($2, $3)', [sid, '2026-03-01', '2026-03-02']);

        // 4. Insert cross-session attendance
        console.log(`Inserting Attendance for ${sess[0].name} (2026-03-01)`);
        await AppDataSource.query('INSERT INTO "student_attendance" (id, "studentId", "classId", "sectionId", date, status, "tenantId", "sessionId") VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7)', 
            [sid, cid, secId, '2026-03-01', 'present', 'tenant-1', sessA]);

        console.log(`Inserting Attendance for ${sess[1].name} (2026-03-02)`);
        await AppDataSource.query('INSERT INTO "student_attendance" (id, "studentId", "classId", "sectionId", date, status, "tenantId", "sessionId") VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7)', 
            [sid, cid, secId, '2026-03-02', 'present', 'tenant-1', sessB]);

        // 5. Query via the service logic (Simulation)
        // Set sessB as active in system
        await AppDataSource.query('UPDATE "academic_sessions" SET "isActive" = true WHERE id = $1', [sessB]);
        await AppDataSource.query('UPDATE "academic_sessions" SET "isActive" = false WHERE id <> $1', [sessB]);

        const results = await AppDataSource.query('SELECT date, "sessionId" FROM "student_attendance" WHERE "studentId" = $1 AND date BETWEEN $2 AND $3', 
            [sid, '2026-03-01', '2026-03-02']);

        console.log('\nAttendance Search Results (Active Session is ' + sess[1].name + '):');
        console.table(results);

        if (results.length === 2) {
            console.log('\n✓ Attendance visibility across sessions SUCCESS');
        } else {
            console.error('\n× Attendance visibility across sessions FAILED');
        }

        // Cleanup
        await AppDataSource.query('DELETE FROM "student_attendance" WHERE id IN ($1, $2)', ['mock-att-1', 'mock-att-2']);
        await AppDataSource.destroy();
    } catch (err) {
        console.error('× Verification failed:', err);
    }
}

verifyAttendance();
