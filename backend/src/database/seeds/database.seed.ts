import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { User } from '../../modules/auth/entities/user.entity';
import { Student } from '../../modules/students/entities/student.entity';
import { Staff } from '../../modules/hr/entities/staff.entity';

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

      // Seed Users
      const users: User[] = [];

      // Admin users
      const admin = userRepository.create({
        email: 'admin@sms.school',
        password: await bcrypt.hash('Admin@12345', 10),
        firstName: 'John',
        lastName: 'Administrator',
        role: 'admin',
        isActive: true,
      });
      users.push(admin);

      // Principal
      const principal = userRepository.create({
        email: 'principal@sms.school',
        password: await bcrypt.hash('Principal@12345', 10),
        firstName: 'Mary',
        lastName: 'Johnson',
        role: 'principal',
        isActive: true,
      });
      users.push(principal);

      // Teachers (5)
      for (let i = 0; i < 5; i++) {
        const teacher = userRepository.create({
          email: `teacher${i + 1}@sms.school`,
          password: await bcrypt.hash(`Teacher@${i + 1}2345`, 10),
          firstName: F.name.firstName(),
          lastName: F.name.lastName(),
          role: 'teacher',
          isActive: true,
        });
        users.push(teacher);
      }

      // Parents/Guardians (10)
      for (let i = 0; i < 10; i++) {
        const parent = userRepository.create({
          email: `parent${i + 1}@sms.school`,
          password: await bcrypt.hash(`Parent@${i + 1}2345`, 10),
          firstName: F.name.firstName(),
          lastName: F.name.lastName(),
          role: 'parent',
          isActive: true,
        });
        users.push(parent);
      }

      // Students (20)
      const studentUsers: User[] = [];
      for (let i = 0; i < 20; i++) {
        const student = userRepository.create({
          email: `student${i + 1}@sms.school`,
          password: await bcrypt.hash(`Student@${i + 1}2345`, 10),
          firstName: F.name.firstName(),
          lastName: F.name.lastName(),
          role: 'student',
          isActive: true,
        });
        users.push(student);
        studentUsers.push(student);
      }

      await userRepository.save(users);
      console.log(`✓ Created ${users.length} users`);

      // Seed Students
      // const classLevels = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
      const students: Student[] = [];

      for (let i = 0; i < studentUsers.length; i++) {
        const student = studentRepository.create({
          userId: studentUsers[i].id,
          admissionNo: `STU-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
          firstName: studentUsers[i].firstName,
          lastName: studentUsers[i].lastName,
          dob: F.date.birthdate ? F.date.birthdate({ min: 10, max: 25, mode: 'age' }) : F.date.past(15),
          gender: F.datatype && typeof F.datatype.boolean === 'function' ? F.datatype.boolean() ? 'Male' : 'Female' : (Math.random() > 0.5 ? 'Male' : 'Female'),
          admissionDate: new Date(),
          isActive: true,
        });
        students.push(student);
      }

      await studentRepository.save(students);
      console.log(`✓ Created ${students.length} student records`);

      // Seed Staff
      const departments = [
        'Administration',
        'Academic',
        'Support Staff',
        'Security',
        'Maintenance',
      ];
      const positions = [
        'Principal',
        'Vice Principal',
        'Head of Department',
        'Teacher',
        'Administrator',
        'Cleaner',
        'Security Officer',
      ];

      /* Commented out until we have seeded Departments and Designations
      const staffMembers: Staff[] = [];
      const staffUsers = users.filter(
        (u) => u.role === 'teacher' || u.role === 'staff',
      );

      for (let i = 0; i < staffUsers.length; i++) {
        const staff = staffRepository.create({
          // ... populate with required fields if we want to restore this
        });
        staffMembers.push(staff);
      }

      await staffRepository.save(staffMembers);
      console.log(`✓ Created ${staffMembers.length} staff records`);
      */

      console.log('\n✅ Database seeding completed successfully!');
      console.log('\n📋 Seed Summary:');
      console.log(`   - Users: ${users.length}`);
      console.log(`   - Students: ${students.length}`);
      // console.log(`   - Staff: ${staffMembers.length}`);
      console.log('\n🔐 Test Credentials:');
      console.log('   Admin: admin@sms.school / Admin@12345');
      console.log('   Principal: principal@sms.school / Principal@12345');
      console.log(
        '   Teacher1: teacher1@sms.school / Teacher@12345',
      );
      console.log('   Student1: student1@sms.school / Student@12345');
    } catch (error) {
      console.error('❌ Error seeding database:', error);
      throw error;
    }
  }
}
