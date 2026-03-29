import { DataSource } from 'typeorm';
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

async function verify() {
    try {
        await AppDataSource.initialize();
        console.log('✓ Connected for verification');

        // Check active session
        const activeSession = await AppDataSource.query('SELECT id, name FROM "academic_sessions" WHERE "isActive" = true LIMIT 1');
        console.log('\n--- Active Session ---');
        console.table(activeSession);

        if (activeSession.length > 0) {
            const sid = activeSession[0].id;
            // Check if homework is correctly assigned to this session
            const hwCount = await AppDataSource.query('SELECT COUNT(*) FROM "homework" WHERE "sessionId" = $1', [sid]);
            console.log(`\nHomework records in active session: ${hwCount[0].count}`);

            // Check if student attendance is correctly assigned
            const attCount = await AppDataSource.query('SELECT COUNT(*) FROM "student_attendance" WHERE "sessionId" = $1', [sid]);
            console.log(`Attendance records in active session: ${attCount[0].count}`);
        }

        await AppDataSource.destroy();
    } catch (err) {
        console.error('× Verification failed:', err);
    }
}

verify();
