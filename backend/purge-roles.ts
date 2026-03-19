import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Role } from './src/modules/auth/entities/role.entity';
import { User } from './src/modules/auth/entities/user.entity';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'sms_user',
  password: process.env.DATABASE_PASSWORD || 'your_secure_password',
  database: process.env.DATABASE_NAME || 'sms_db',
  entities: [
    'src/modules/auth/entities/role.entity.ts',
    'src/modules/auth/entities/user.entity.ts',
    'src/modules/auth/entities/permission.entity.ts',
  ],
  synchronize: false,
});

async function purgeRoles() {
  try {
    await dataSource.initialize();
    console.log('✓ Database connected');

    const roleRepo = dataSource.getRepository(Role);
    const userRepo = dataSource.getRepository(User);

    // 1. Find the "Admin" role
    let adminRole = await roleRepo.findOne({ where: { name: 'Admin' } });
    
    if (!adminRole) {
        console.log('! Admin role not found. Creating it...');
        adminRole = roleRepo.create({ name: 'Admin', description: 'Full system access', isSystem: true });
        await roleRepo.save(adminRole);
    }

    console.log(`✓ Admin role ID: ${adminRole.id}`);

    // 2. Reassign users or clear their roleId if it's not Admin
    // For safety, we'll set roleId to null for anyone not assigned to the definitive Admin role
    const result = await userRepo.createQueryBuilder()
        .update(User)
        .set({ roleId: null })
        .where('roleId IS NOT NULL AND roleId != :adminId', { adminId: adminRole.id })
        .execute();
    
    console.log(`✓ Updated ${result.affected} users (unassigned from defunct roles)`);

    // 3. Delete all roles except "Admin"
    const deleteResult = await roleRepo.createQueryBuilder()
        .delete()
        .from(Role)
        .where('name != :name', { name: 'Admin' })
        .execute();

    console.log(`✓ Deleted ${deleteResult.affected} roles`);

    await dataSource.destroy();
    console.log('✓ Purge complete');
  } catch (err) {
    console.error('Error purging roles:', err);
  }
}

purgeRoles();
