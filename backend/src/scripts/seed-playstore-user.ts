import AppDataSource from '../data-source';
import { User } from '../modules/auth/entities/user.entity';
import { Role } from '../modules/auth/entities/role.entity';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seedPlaystoreUser() {
  try {
    console.log('🔄 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connection established.');

    const queryRunner = AppDataSource.createQueryRunner();
    
    // 1. Find a Role for the test user (Student or Teacher)
    let userRole = await queryRunner.manager.findOne(Role, {
      where: { name: 'Student' },
    });

    // If Student doesn't exist, fallback to Teacher or Admin
    if (!userRole) {
      userRole = await queryRunner.manager.findOne(Role, {
        where: { name: 'Teacher' },
      });
    }

    if (!userRole) {
        console.error('❌ Could not find Student or Teacher role. Using Super Administrator fallback.');
        userRole = await queryRunner.manager.findOne(Role, {
          where: { name: 'Super Administrator' },
        });
    }

    const email = 'playstore.test@phjcschool.com';
    let testUser = await queryRunner.manager.findOne(User, {
      where: { email }
    });

    if (!testUser && userRole) {
      console.log(`Creating test user with email: ${email}`);
      const hashedPassword = await bcrypt.hash('PlayStoreTest2026!', 10);
      const tenantId = uuidv4();
      
      testUser = queryRunner.manager.create(User, {
        firstName: 'Google',
        lastName: 'Reviewer',
        email: email,
        password: hashedPassword,
        roleId: userRole.id,
        role: userRole.name,
        tenantId: tenantId,
        isActive: true,
      });
      await queryRunner.manager.save(User, testUser);
      console.log('✅ Play Store test user created successfully.');
      console.log('--------------------------------------------------');
      console.log(`Username/Email: ${email}`);
      console.log(`Password: PlayStoreTest2026!`);
      console.log('--------------------------------------------------');
    } else if (testUser) {
      console.log(`⚠️ Test user with email ${email} already exists.`);
      const hashedPassword = await bcrypt.hash('PlayStoreTest2026!', 10);
      testUser.password = hashedPassword;
      await queryRunner.manager.save(User, testUser);
      console.log('✅ Password has been reset to: PlayStoreTest2026!');
    }

    await AppDataSource.destroy();
    console.log('👋 Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test user:', error);
    process.exit(1);
  }
}

seedPlaystoreUser();
