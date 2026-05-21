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

async function checkSuperAdmins() {
    try {
        await AppDataSource.initialize();
        console.log('✓ Database connected\n');

        const query = `
            SELECT id, email, "firstName", "lastName", role, "tenantId", "isActive"
            FROM "users" 
            WHERE "role" ILIKE '%super administrator%'
        `;

        const superAdmins = await AppDataSource.query(query);

        console.log(`Found ${superAdmins.length} Super Administrator(s) in the system:`);
        
        if (superAdmins.length > 0) {
            console.table(superAdmins.map((admin: any) => ({
                Email: admin.email,
                Name: `${admin.firstName} ${admin.lastName}`,
                Status: admin.isActive ? 'Active' : 'Inactive',
                Role: admin.role,
                TenantID: admin.tenantId
            })));
        }

        await AppDataSource.destroy();
    } catch (err) {
        console.error('× Failed to fetch super administrators:', err);
        process.exit(1);
    }
}

checkSuperAdmins();
