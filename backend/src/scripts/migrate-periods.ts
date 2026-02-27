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
    synchronize: false,
});

async function migrate() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected.');

        const queryRunner = AppDataSource.createQueryRunner();

        // check if column exists
        const hasColumn = await queryRunner.hasColumn('timetable_periods', 'type');
        if (!hasColumn) {
            console.log('Adding "type" column to timetable_periods...');
            await queryRunner.query(`ALTER TABLE "timetable_periods" ADD "type" character varying NOT NULL DEFAULT 'LESSON'`);
            console.log('"type" column added.');
        } else {
            console.log('"type" column already exists.');
        }

        await AppDataSource.destroy();
    } catch (error) {
        console.error('Error during migration:', error);
        process.exit(1);
    }
}

migrate();
