import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

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

async function check() {
    try {
        await AppDataSource.initialize();
        console.log('✓ Database connected');

        const migrations = await AppDataSource.query('SELECT * FROM "migrations" ORDER BY "timestamp" DESC');
        console.log('\n--- Recent Migrations ---');
        console.table(migrations.slice(0, 5));

        const tables = await AppDataSource.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('class_subject', 'academic_sessions', 'student_attendance')
        `);
        console.log('\n--- Tables Check ---');
        console.table(tables);

        const columns = await AppDataSource.query(`
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND column_name = 'sessionId'
        `);
        console.log('\n--- sessionId Column Presence ---');
        console.table(columns);

        await AppDataSource.destroy();
    } catch (err) {
        console.error('× Check failed:', err);
    }
}

check();
