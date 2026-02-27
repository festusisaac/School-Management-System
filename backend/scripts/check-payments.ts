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

async function checkPayments() {
    try {
        console.log('🔌 Connecting to database...');
        await AppDataSource.initialize();

        console.log('📊 Checking for transactions...');
        const result = await AppDataSource.query(`
      SELECT id, amount, "paymentMethod", reference, "createdAt", "studentId", type
      FROM transactions 
      ORDER BY "createdAt" DESC 
      LIMIT 10
    `);

        console.log(`\n✅ Found ${result.length} transaction(s):\n`);
        result.forEach((tx: any, index: number) => {
            console.log(`${index + 1}. ID: ${tx.id.substring(0, 8)}...`);
            console.log(`   Amount: ${tx.amount}`);
            console.log(`   Method: ${tx.paymentMethod}`);
            console.log(`   Type: ${tx.type}`);
            console.log(`   Date: ${tx.createdAt}`);
            console.log(`   Student ID: ${tx.studentId?.substring(0, 8) || 'N/A'}...`);
            console.log(`   Reference: ${tx.reference || 'N/A'}`);
            console.log('');
        });

        await AppDataSource.destroy();
        console.log('🔌 Database connection closed.');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkPayments();
