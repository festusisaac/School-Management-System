import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { User } from '../../modules/auth/entities/user.entity';
import { Student } from '../../modules/students/entities/student.entity';
import { Staff } from '../../modules/hr/entities/staff.entity';
import { seedRoles } from './roles.seed';

// Some faker typings vary between versions; keep a short alias to avoid TS issues
const F: any = faker;

export class SeedDatabase {
  async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);
    const studentRepository = dataSource.getRepository(Student);
    const staffRepository = dataSource.getRepository(Staff);

    console.log('🌱 Starting database seeding...');

    try {
      // Clear existing data
      await studentRepository.delete({});
      await staffRepository.delete({});
      await userRepository.delete({});
      console.log('✓ Cleared existing data');

      // Seed Roles
      await seedRoles(dataSource);
      const users: User[] = [];

      // Admin users
      const admin = userRepository.create({
        email: 'admin@sms.school',
        password: await bcrypt.hash('Admin@12345', 10),
        firstName: 'John',
        lastName: 'Administrator',
        role: 'super administrator',
        isActive: true,
      });
      users.push(admin);

      await userRepository.save(users);

      await userRepository.save(users);
      console.log(`✓ Created ${users.length} users`);

      console.log('\n✅ Database seeding completed successfully!');
      console.log('\n📋 Seed Summary:');
      console.log(`   - Users: ${users.length}`);
      console.log('\n🔐 Test Credentials:');
      console.log('   Super Admin: admin@sms.school / Admin@12345');
    } catch (error) {
      console.error('❌ Error seeding database:', error);
      throw error;
    }
  }
}
