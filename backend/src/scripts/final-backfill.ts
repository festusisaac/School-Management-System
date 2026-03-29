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

const tables = [
    'student_attendance',
    'homework',
    'timetables',
    'exams',
    'exam_results',
    'exam_groups',
    'student_term_results',
    'transactions',
    'fee_assignments',
    'staff_attendance',
    'carry_forwards'
];

async function backfill() {
    try {
        await AppDataSource.initialize();
        console.log('✓ Connected for final backfill');

        const activeSession = await AppDataSource.query('SELECT id FROM "academic_sessions" WHERE "isActive" = true LIMIT 1');
        if (activeSession.length === 0) {
            console.error('× No active session found. Skipping backfill.');
            return;
        }

        const sid = activeSession[0].id;
        console.log(`Active Session ID: ${sid}`);

        for (const table of tables) {
            try {
                // Try sessionId (camelCase)
                const result = await AppDataSource.query(`UPDATE "${table}" SET "sessionId" = $1 WHERE "sessionId" IS NULL`, [sid]);
                console.log(`✓ Table "${table}" (sessionId): ${result[1]} rows updated.`);
            } catch (e: any) {
                if (e.code === '42703') { // Undefined column
                    // Try session_id (snake_case)
                    try {
                        const result = await AppDataSource.query(`UPDATE "${table}" SET "session_id" = $1 WHERE "session_id" IS NULL`, [sid]);
                        console.log(`✓ Table "${table}" (session_id): ${result[1]} rows updated.`);
                    } catch (e2) {
                        console.error(`× Table "${table}" failed for both sessionId and session_id.`);
                    }
                } else {
                    console.error(`× Table "${table}" failed: ${e.message}`);
                }
            }
        }

        await AppDataSource.destroy();
        console.log('\n--- Backfill Complete ---');
    } catch (err) {
        console.error('× Backfill failed:', err);
    }
}

backfill();
