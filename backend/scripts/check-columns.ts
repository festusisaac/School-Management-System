import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function checkSchema() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        synchronize: false,
    });

    try {
        await dataSource.initialize();
        console.log('✅ Database connected.');

        const result = await dataSource.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'students';
        `);
        console.log('--- Columns in "students" table ---');
        result.forEach((col: any) => {
            console.log(`- ${col.column_name} (${col.data_type}) [nullable: ${col.is_nullable}]`);
        });

    } catch (error) {
        console.error('❌ Error checking schema:', error);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

checkSchema();
