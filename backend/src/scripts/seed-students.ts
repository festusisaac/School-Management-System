import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import AppDataSource from '../data-source';
import { Student } from '../modules/students/entities/student.entity';
import { User } from '../modules/auth/entities/user.entity';
import { Class } from '../modules/academics/entities/class.entity';
import { Section } from '../modules/academics/entities/section.entity';
import { Transaction } from '../modules/finance/entities/transaction.entity';
import { StudentAttendance } from '../modules/students/entities/student-attendance.entity';

async function seedStudents() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected.');

    const userRepo = AppDataSource.getRepository(User);
    const admin = await userRepo.findOne({ where: {} });

    if (!admin) {
      console.log('No user found, cannot determine tenantId.');
      process.exit(1);
    }

    const tenantId = admin.tenantId;
    console.log(`Found tenantId: ${tenantId}`);

    const studentRepo = AppDataSource.getRepository(Student);

    const classRepo = AppDataSource.getRepository(Class);
    const sectionRepo = AppDataSource.getRepository(Section);
    const txRepo = AppDataSource.getRepository(Transaction);
    const attendanceRepo = AppDataSource.getRepository(StudentAttendance);

    console.log('Clearing old fake finance/attendance data...');
    await txRepo.delete({ tenantId });
    await attendanceRepo.delete({ tenantId });

    console.log('Clearing old fake students...');
    await studentRepo.delete({ tenantId });

    console.log('Clearing old fake academics data...');
    await sectionRepo.delete({ tenantId });
    await classRepo.delete({ tenantId });

    console.log('Creating Class and Section...');
    let myClass = new Class();
    myClass.tenantId = tenantId;
    myClass.name = 'SSS 1';
    myClass = await classRepo.save(myClass);

    let mySection = new Section();
    mySection.tenantId = tenantId;
    mySection.name = 'A';
    mySection.class = myClass;
    mySection = await sectionRepo.save(mySection);

    console.log('Seeding 20 new students...');
    const students: Student[] = [];

    for (let i = 1; i <= 20; i++) {
      const isMale = faker.datatype.boolean();
      const firstName = faker.person.firstName(isMale ? 'male' : 'female');
      const lastName = faker.person.lastName();
      
      const student = new Student();
      student.tenantId = tenantId;
      student.admissionNo = `2024-${String(i).padStart(3, '0')}`;
      student.firstName = firstName;
      student.lastName = lastName;
      student.dob = faker.date.birthdate({ min: 10, max: 18, mode: 'age' });
      student.gender = isMale ? 'Male' : 'Female';
      student.bloodGroup = faker.helpers.arrayElement(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']);
      student.religion = faker.helpers.arrayElement(['Christianity', 'Islam', 'Other']);
      student.currentAddress = faker.location.streetAddress();
      student.stateOfOrigin = faker.location.state();
      student.mobileNumber = faker.phone.number();
      student.admissionDate = new Date();
      student.isActive = faker.datatype.boolean({ probability: 0.85 }); // 85% active
      
      // Assign class & section
      student.class = myClass;
      student.section = mySection;
      
      // Random photo
      student.studentPhoto = `https://i.pravatar.cc/150?u=${student.admissionNo}`;

      students.push(student);
    }

    await studentRepo.save(students);
    console.log('Successfully seeded 20 students!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding students:', error);
    process.exit(1);
  }
}

seedStudents();
