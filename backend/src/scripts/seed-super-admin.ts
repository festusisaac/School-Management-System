import AppDataSource from '../data-source';
import { User } from '../modules/auth/entities/user.entity';
import { Role } from '../modules/auth/entities/role.entity';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seedSuperAdmin() {
  try {
    console.log('🔄 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connection established.');

    const queryRunner = AppDataSource.createQueryRunner();
    
    // 1. Find Super Admin Role
    const superAdminRole = await queryRunner.manager.findOne(Role, {
      where: { name: 'Super Administrator' },
    });

    if (!superAdminRole) {
        console.error('❌ Super Administrator role not found. Please run seed roles first.');
        process.exit(1);
    }

    const email = 'festusisaac848@gmail.com';
    let adminUser = await queryRunner.manager.findOne(User, {
      where: { email }
    });

    if (!adminUser) {
      console.log(`Creating super admin user with email: ${email}`);
      const hashedPassword = await bcrypt.hash('12345678', 10);
      const tenantId = uuidv4();
      adminUser = queryRunner.manager.create(User, {
        firstName: 'System',
        lastName: 'Administrator',
        email: email,
        password: hashedPassword,
        roleId: superAdminRole.id,
        role: 'Super Administrator',
        tenantId: tenantId,
        isActive: true,
      });
      await queryRunner.manager.save(User, adminUser);
      console.log('✅ Super admin user created successfully.');
      console.log(`Email: ${email}`);
      console.log(`Password: 12345678`);
    } else {
      console.log(`⚠️ Super admin user with email ${email} already exists.`);
      const hashedPassword = await bcrypt.hash('12345678', 10);
      adminUser.password = hashedPassword;
      await queryRunner.manager.save(User, adminUser);
      console.log('✅ Password reset to: 12345678');
    }

    await AppDataSource.destroy();
    console.log('👋 Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding super admin:', error);
    process.exit(1);
  }
}

seedSuperAdmin();
