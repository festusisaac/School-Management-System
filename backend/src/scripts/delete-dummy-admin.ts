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
  schema: 'public',
});

async function deleteDummyAdmin() {
    try {
        await AppDataSource.initialize();
        console.log('✓ Database connected');

        const emailToDelete = 'admin@sms.school';
        
        // Find the user first to make sure they exist
        const users = await AppDataSource.query(`SELECT id, email FROM "users" WHERE email = $1`, [emailToDelete]);

        if (users.length === 0) {
            console.log(`- User ${emailToDelete} not found. Already deleted?`);
        } else {
            // Delete the user
            await AppDataSource.query(`DELETE FROM "users" WHERE email = $1`, [emailToDelete]);
            console.log(`✓ Successfully deleted dummy administrator: ${emailToDelete}`);
        }

        await AppDataSource.destroy();
    } catch (err) {
        console.error('× Failed to delete user:', err);
        process.exit(1);
    }
}

deleteDummyAdmin();
