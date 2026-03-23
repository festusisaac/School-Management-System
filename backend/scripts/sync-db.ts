import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function sync() {
    console.log('🚀 Starting System-Wide Database Schema Sync...');
    
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        entities: [
            path.join(__dirname, '..', 'src', 'modules', '**', 'entities', '*.entity.ts')
        ],
        synchronize: true,
        logging: true,
    });

    try {
        await dataSource.initialize();
        console.log('✅ Database synchronized successfully!');
    } catch (error) {
        console.error('❌ Error synchronizing database:', error);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

sync();
