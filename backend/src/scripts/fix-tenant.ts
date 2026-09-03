import AppDataSource from '../data-source';
import { User } from '../modules/auth/entities/user.entity';
import { Student } from '../modules/students/entities/student.entity';

async function fixTenant() {
  try {
    await AppDataSource.initialize();
    
    const queryRunner = AppDataSource.createQueryRunner();
    
    // Find any existing student to get the correct tenant ID
    const anyStudent = await queryRunner.manager.findOne(Student, { where: {} });
    
    if (!anyStudent) {
      console.log('No students found in the database. Backup might be empty.');
      process.exit(0);
    }
    
    const originalTenantId = anyStudent.tenantId;
    console.log(`Found original tenantId from backup data: ${originalTenantId}`);
    
    // Update the admin user
    const email = 'festusisaac848@gmail.com';
    const adminUser = await queryRunner.manager.findOne(User, { where: { email } });
    
    if (adminUser) {
      adminUser.tenantId = originalTenantId;
      await queryRunner.manager.save(User, adminUser);
      console.log(`✅ Successfully updated admin user (${email}) to use the correct tenantId!`);
    } else {
      console.log(`Admin user ${email} not found.`);
    }
    
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixTenant();
