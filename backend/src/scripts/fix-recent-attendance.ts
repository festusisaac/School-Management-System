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

async function fixRecentAttendance() {
    try {
        await AppDataSource.initialize();
        console.log('✓ Database connected for attendance fix');

        // 1. Get the current active session ID
        const system = await AppDataSource.query('SELECT "currentSessionId" FROM "system_settings" LIMIT 1');
        if (system.length === 0 || !system[0].currentSessionId) {
            console.log('! No active session ID found in system settings.');
            return;
        }
        const activeSessId = system[0].currentSessionId;
        console.log(`Current Active Session: ${activeSessId}`);

        // 2. Identify records from the last 7 days that have a DIFFERENT session ID
        // Note: Using current_date - 7 to catch everything since the session switch
        const mismatch = await AppDataSource.query(
            'SELECT id, date, "sessionId" FROM "student_attendance" WHERE date >= CURRENT_DATE - INTERVAL \'7 days\' AND "sessionId" != $1',
            [activeSessId]
        );

        if (mismatch.length === 0) {
            console.log('✓ No misplaced attendance records found in the last 7 days.');
        } else {
            console.log(`! Found ${mismatch.length} misplaced records. Moving to session ${activeSessId}...`);
            
            const result = await AppDataSource.query(
                'UPDATE "student_attendance" SET "sessionId" = $1 WHERE date >= CURRENT_DATE - INTERVAL \'7 days\' AND "sessionId" != $1',
                [activeSessId]
            );
            console.log(`✓ Successfully updated ${mismatch.length} records.`);
        }

        await AppDataSource.destroy();
    } catch (err) {
        console.error('× Fix failed:', err);
    }
}

fixRecentAttendance();
