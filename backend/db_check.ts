import { DataSource } from 'typeorm';
import { User } from './src/modules/auth/entities/user.entity';
import { Role } from './src/modules/auth/entities/role.entity';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkDb() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [User, Role],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection successful');

    const userRepository = dataSource.getRepository(User);
    const users = await userRepository.find();
    console.log(`📊 Found ${users.length} users`);

    const admin = users.find(u => u.email === 'admin@sms.school');
    if (admin) {
      console.log('👤 Admin User Details:');
      console.log(`   - ID: ${admin.id}`);
      console.log(`   - Role: ${admin.role}`);
      console.log(`   - TenantID: ${admin.tenantId}`);
    } else {
      console.log('❌ Admin user not found');
    }

    // Check Roles enum in DB if possible
    const roles = await dataSource.query('SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = \'users_role_enum\'');
    console.log('📋 Roles Enum in DB:', roles.map((r: any) => r.enumlabel).join(', '));

  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await dataSource.destroy();
  }
}

checkDb();
