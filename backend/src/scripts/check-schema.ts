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

async function checkSchema() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected.');

        const queryRunner = AppDataSource.createQueryRunner();
        const table = await queryRunner.getTable('timetable_periods');

        if (table) {
            console.log('Columns in timetable_periods:');
            table.columns.forEach(c => console.log(`- ${c.name} (${c.type})`));
        } else {
            console.log('Table timetable_periods does not exist.');
        }

        await AppDataSource.destroy();
    } catch (error) {
        console.error('Error checking schema:', error);
        process.exit(1);
    }
}

checkSchema();
