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

async function diagnostic() {
    try {
        await AppDataSource.initialize();
        console.log('✓ Database connected for diagnostic');

        // Check global system setting
        const system = await AppDataSource.query('SELECT "currentSessionId", "schoolName" FROM "system_settings" LIMIT 1');
        console.log('\n--- System Settings ---');
        console.table(system);

        // Check active session record
        const activeSess = await AppDataSource.query('SELECT id, name FROM "academic_sessions" WHERE "isActive" = true');
        console.log('\n--- Active Session Entity ---');
        console.table(activeSess);

        // Check last 10 attendance records
        const att = await AppDataSource.query('SELECT id, date, "studentId", "sessionId" FROM "student_attendance" ORDER BY "createdAt" DESC LIMIT 10');
        console.log('\n--- Recent Attendance Records ---');
        console.table(att);

        await AppDataSource.destroy();
    } catch (err) {
        console.error('× Diagnostic failed:', err);
    }
}

diagnostic();
