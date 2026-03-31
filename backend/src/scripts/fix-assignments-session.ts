import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'sms_user',
  password: process.env.DATABASE_PASSWORD || 'sms_password',
  database: process.env.DATABASE_NAME || 'sms_db',
  schema: 'public',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function repairAssignments() {
  try {
    await AppDataSource.initialize();
    console.log('✓ Database connected for assignment repair');

    // 1. Find the active academic session
    const activeSessions = await AppDataSource.query(
      'SELECT id, name FROM "academic_sessions" WHERE "isActive" = true LIMIT 1'
    );

    if (activeSessions.length === 0) {
      console.error('× No active academic session found. Please set one as active in the UI first.');
      return;
    }

    const sessionId = activeSessions[0].id;
    const sessionName = activeSessions[0].name;
    console.log(`Target Active Session: ${sessionName} (${sessionId})`);

    // 2. Count orphaned assignments
    const orphanedCount = await AppDataSource.query(
      'SELECT COUNT(*) FROM "fee_assignments" WHERE "sessionId" IS NULL'
    );
    console.log(`Found ${orphanedCount[0].count} assignments missing a sessionId.`);

    if (orphanedCount[0].count === '0') {
      console.log('✓ No orphaned assignments found. Everything looks good!');
    } else {
      // 3. Update orphaned assignments
      console.log('Updating orphaned assignments to use the active session...');
      const updateResult = await AppDataSource.query(
        'UPDATE "fee_assignments" SET "sessionId" = $1 WHERE "sessionId" IS NULL',
        [sessionId]
      );
      console.log(`✓ successfully updated ${orphanedCount[0].count} assignments.`);
    }

    await AppDataSource.destroy();
    console.log('✓ Task completed.');
  } catch (err) {
    console.error('× Repair failed:', err);
  }
}

repairAssignments();
