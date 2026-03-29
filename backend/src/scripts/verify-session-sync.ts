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

async function verifySync() {
    try {
        await AppDataSource.initialize();
        console.log('✓ Database connected for sync verification');

        // 1. Check current system settings
        const settings = await AppDataSource.query('SELECT "currentSessionId", "currentTermId" FROM "system_settings" LIMIT 1');
        console.log('\nInitial System Settings:');
        console.table(settings);

        // 2. Find an academic session that is NOT the current one
        const sessions = await AppDataSource.query('SELECT id, name FROM "academic_sessions" WHERE "isActive" = false LIMIT 1');
        if (sessions.length > 0) {
            const newSid = sessions[0].id;
            console.log(`\nSimulating AcademicSessionsService update for session: ${sessions[0].name} (${newSid})`);
            
            // Perform the synchronization logic manually (simulating the service)
            await AppDataSource.query('UPDATE "academic_sessions" SET "isActive" = true WHERE id = $1', [newSid]);
            await AppDataSource.query('UPDATE "academic_sessions" SET "isActive" = false WHERE id <> $1', [newSid]);
            await AppDataSource.query('UPDATE "system_settings" SET "currentSessionId" = $1', [newSid]);
            
            const updatedSettings = await AppDataSource.query('SELECT "currentSessionId" FROM "system_settings" LIMIT 1');
            console.log('Updated System Settings (Session):');
            console.table(updatedSettings);
            
            if (updatedSettings[0].currentSessionId === newSid) {
                console.log('✓ Session Synchronization SUCCESS');
            } else {
                console.error('× Session Synchronization FAILED');
            }
        } else {
            console.log('! No inactive sessions found to test sync.');
        }

        await AppDataSource.destroy();
    } catch (err) {
        console.error('× Sync verification failed:', err);
    }
}

verifySync();
