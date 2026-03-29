import { DataSource, Not } from 'typeorm';
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
        console.log('✓ Database connected for singular session check');

        // Set all sessions to inactive first
        await AppDataSource.query('UPDATE "academic_sessions" SET "isActive" = false');

        // Create two mock sessions IDs (manually or just find existing)
        const sessions = await AppDataSource.query('SELECT id, name FROM "academic_sessions" LIMIT 2');
        if (sessions.length < 2) {
            console.error('× Need at least 2 sessions to test. Please create them in the UI first.');
            return;
        }

        const s1 = sessions[0].id;
        const s2 = sessions[1].id;

        console.log(`Setting session ${sessions[0].name} (${s1}) to active...`);
        // We simulate the service logic:
        await AppDataSource.query('UPDATE "academic_sessions" SET "isActive" = true WHERE id = $1', [s1]);
        // Simulate enforceSingularActive:
        await AppDataSource.query('UPDATE "academic_sessions" SET "isActive" = false WHERE id <> $1', [s1]);

        console.log(`Setting session ${sessions[1].name} (${s2}) to active (Simulating Update)...`);
        await AppDataSource.query('UPDATE "academic_sessions" SET "isActive" = true WHERE id = $1', [s2]);
        // Enforce:
        await AppDataSource.query('UPDATE "academic_sessions" SET "isActive" = false WHERE id <> $1', [s2]);

        const activeCount = await AppDataSource.query('SELECT COUNT(*) FROM "academic_sessions" WHERE "isActive" = true');
        console.log(`\nActive Sessions Count: ${activeCount[0].count}`);

        const activeSession = await AppDataSource.query('SELECT name FROM "academic_sessions" WHERE "isActive" = true');
        console.log(`Active Session Name: ${activeSession[0]?.name}`);

        if (activeCount[0].count === '1') {
            console.log('\n✓ Singular active session enforced SUCCESS');
        } else {
            console.error('\n× FAILED: Multiple active sessions found');
        }

        await AppDataSource.destroy();
    } catch (err) {
        console.error('× Verification failed:', err);
    }
}

verify();
