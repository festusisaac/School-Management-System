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
    entities: ['src/**/*.entity{.ts,.js}'],
    synchronize: false,
});

async function resetTimetable() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected.');

        const queryRunner = AppDataSource.createQueryRunner();

        console.log('Clearing timetables table...');
        await queryRunner.query(`DELETE FROM "timetables"`);

        console.log('Clearing timetable_periods table...');
        await queryRunner.query(`DELETE FROM "timetable_periods"`);

        console.log('Timetable data reset successfully.');
        await AppDataSource.destroy();
    } catch (error) {
        console.error('Error resetting timetable data:', error);
        process.exit(1);
    }
}

resetTimetable();
