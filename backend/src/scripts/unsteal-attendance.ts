import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'sms_user',
  password: process.env.DATABASE_PASSWORD || 'sms_password',
  database: process.env.DATABASE_NAME || 'sms_db'
});

async function unsteal() {
    try {
        await AppDataSource.initialize();
        console.log('✓ Database connected for un-stealing');

        // Old Session ID from previous turn diagnostics
        const oldSessId = 'b86384ba-4274-4271-a3ab-7140fcdca525';
        const newSessId = '58307ac3-c104-4c92-9693-16daf0586e3a';

        // Find records for dates BEFORE the switch (March 29) that are currently in the NEW session
        const stolen = await AppDataSource.query(
            'SELECT id, date FROM "student_attendance" WHERE date < \'2026-03-29\' AND "sessionId" = $1',
            [newSessId]
        );

        if (stolen.length === 0) {
            console.log('✓ No stolen records found.');
        } else {
            console.log(`! Found ${stolen.length} records that belong to the Old Session. Restoring...`);
            await AppDataSource.query(
                'UPDATE "student_attendance" SET "sessionId" = $1 WHERE date < \'2026-03-29\' AND "sessionId" = $2',
                [oldSessId, newSessId]
            );
            console.log(`✓ Restored ${stolen.length} records to session ${oldSessId}`);
        }

        await AppDataSource.destroy();
    } catch (err) {
        console.error('× Un-stealing failed:', err);
    }
}

unsteal();
