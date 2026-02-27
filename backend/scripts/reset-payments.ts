import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [path.join(__dirname, '../dist/**/*.entity.js')],
    synchronize: false,
});

async function resetAllPayments() {
    try {
        console.log('🔌 Connecting to database...');
        await AppDataSource.initialize();

        console.log('📊 Counting existing transactions...');
        const result = await AppDataSource.query('SELECT COUNT(*) as count FROM transactions');
        const count = parseInt(result[0].count);
        console.log(`   Found ${count} transaction(s)`);

        if (count === 0) {
            console.log('✅ No transactions to delete.');
            await AppDataSource.destroy();
            return;
        }

        console.log('🗑️  Deleting all transactions...');
        await AppDataSource.query('DELETE FROM transactions');

        const newResult = await AppDataSource.query('SELECT COUNT(*) as count FROM transactions');
        const newCount = parseInt(newResult[0].count);
        console.log(`✅ Reset complete! Deleted ${count} transaction(s). Remaining: ${newCount}`);

        await AppDataSource.destroy();
        console.log('🔌 Database connection closed.');
    } catch (error) {
        console.error('❌ Error during reset:', error);
        process.exit(1);
    }
}

resetAllPayments();
