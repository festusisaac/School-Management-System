import { DataSource } from 'typeorm';
import { User } from '../modules/auth/entities/user.entity';
import { Role } from '../modules/auth/entities/role.entity';
import { Permission } from '../modules/auth/entities/permission.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const permissionsData = [
  // Students
  { slug: 'students:view', name: 'View Students', module: 'Students' },
  { slug: 'students:create', name: 'Create Student', module: 'Students' },
  { slug: 'students:edit', name: 'Edit Student', module: 'Students' },
  { slug: 'students:delete', name: 'Delete Student', module: 'Students' },
  { slug: 'students:promote', name: 'Promote Students', module: 'Students' },

  // Academics
  { slug: 'academics:manage_sessions', name: 'Manage Sessions', module: 'Academics' },
  { slug: 'academics:manage_terms', name: 'Manage Terms', module: 'Academics' },
  { slug: 'academics:manage_classes', name: 'Manage Classes', module: 'Academics' },
  { slug: 'academics:manage_subjects', name: 'Manage Subjects', module: 'Academics' },
  { slug: 'academics:manage_timetable', name: 'Manage Timetable', module: 'Academics' },

  // HR
  { slug: 'hr:manage_staff', name: 'Manage Staff', module: 'HR' },
  { slug: 'hr:manage_payroll', name: 'Manage Payroll', module: 'HR' },
  { slug: 'hr:manage_attendance', name: 'Manage Attendance', module: 'HR' },
  { slug: 'hr:manage_leave', name: 'Manage Leave', module: 'HR' },

  // Finance
  { slug: 'finance:view_fees', name: 'View Fees', module: 'Finance' },
  { slug: 'finance:collect_fees', name: 'Collect Fees', module: 'Finance' },
  { slug: 'finance:manage_expenses', name: 'Manage Expenses', module: 'Finance' },
  { slug: 'finance:reports', name: 'Financial Reports', module: 'Finance' },

  // Examination
  { slug: 'exams:manage_setup', name: 'Manage Exam Setup', module: 'Examination' },
  { slug: 'exams:manage_schedule', name: 'Manage Exam Schedule', module: 'Examination' },
  { slug: 'exams:manage_grades', name: 'Manage Grade Scales', module: 'Examination' },
  { slug: 'exams:enter_marks', name: 'Enter Marks', module: 'Examination' },
  { slug: 'exams:manage_admit_cards', name: 'Manage Admit Cards', module: 'Examination' },
  { slug: 'exams:publish_results', name: 'Publish Results', module: 'Examination' },
  { slug: 'exams:manage_domains', name: 'Manage Behavioral Domains', module: 'Examination' },

  // Settings
  { slug: 'settings:general', name: 'General Settings', module: 'Settings' },
  { slug: 'settings:roles_permissions', name: 'Roles & Permissions', module: 'Settings' },
  { slug: 'settings:backups', name: 'Manage Backups', module: 'Settings' },

  // Library
  { slug: 'library:view_books', name: 'View Books', module: 'Library' },
  { slug: 'library:manage_books', name: 'Manage Books', module: 'Library' },
  { slug: 'library:issue_return', name: 'Issue/Return Books', module: 'Library' },

  // Dormitory
  { slug: 'dormitory:manage_hostels', name: 'Manage Hostels', module: 'Dormitory' },
  { slug: 'dormitory:manage_rooms', name: 'Manage Rooms', module: 'Dormitory' },
  { slug: 'dormitory:assign_rooms', name: 'Assign Rooms', module: 'Dormitory' },

  // Communication
  { slug: 'communication:send_sms', name: 'Send SMS', module: 'Communication' },
  { slug: 'communication:send_email', name: 'Send Email', module: 'Communication' },
  { slug: 'communication:notice_board', name: 'Notice Board', module: 'Communication' },

  // Reporting
  { slug: 'reports:attendance', name: 'Attendance Reports', module: 'Reporting' },
  { slug: 'reports:academic', name: 'Academic Reports', module: 'Reporting' },
  { slug: 'reports:financial', name: 'Financial Reports', module: 'Reporting' },
];

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'sms_db',
    entities: [User, Role, Permission],
    synchronize: true,
  });

  try {
    await dataSource.initialize();
    console.log('Database connected!');

    const permissionRepo = dataSource.getRepository(Permission);
    const roleRepo = dataSource.getRepository(Role);
    const userRepo = dataSource.getRepository(User);

    // 1. Seed Permissions
    const savedPermissions: Permission[] = [];
    for (const pData of permissionsData) {
      let p = await permissionRepo.findOne({ where: { slug: pData.slug } });
      if (!p) {
        p = permissionRepo.create(pData);
        await permissionRepo.save(p);
        console.log(`Created permission: ${p.slug}`);
      }
      savedPermissions.push(p);
    }

    // 2. Seed Default Roles
    const rolesToSeed = [
      { name: 'Admin', isSystem: true, permissions: savedPermissions },
      { name: 'Principal', isSystem: true, permissions: savedPermissions.filter(p => !p.slug.startsWith('settings:')) },
      { name: 'Teacher', isSystem: true, permissions: savedPermissions.filter(p => p.slug.includes('view') || p.slug.includes('enter_marks')) },
      { name: 'Staff', isSystem: true, permissions: savedPermissions.filter(p => p.slug.includes('view')) },
      { name: 'Student', isSystem: true, permissions: savedPermissions.filter(p => p.slug === 'students:view') },
      { name: 'Parent', isSystem: true, permissions: savedPermissions.filter(p => p.slug === 'students:view') },
    ];

    const roleMap = new Map<string, Role>();
    for (const rData of rolesToSeed) {
      let r = await roleRepo.findOne({ where: { name: rData.name }, relations: ['permissions'] });
      if (!r) {
        r = roleRepo.create({
          name: rData.name,
          isSystem: rData.isSystem,
          permissions: rData.permissions,
        });
        await roleRepo.save(r);
        console.log(`Created role: ${r.name}`);
      }
      roleMap.set(rData.name.toLowerCase(), r);
    }

    // 3. Migrate Users
    console.log('Migrating users to dynamic roles...');
    const users = await userRepo.find();
    for (const user of users) {
      if (user.role && !user.roleId) {
        const mappedRole = roleMap.get(user.role.toLowerCase());
        if (mappedRole) {
          user.roleId = mappedRole.id;
          await userRepo.save(user);
          console.log(`Migrated user ${user.email} to role ${mappedRole.name}`);
        } else {
            console.log(`Warning: No role found for user ${user.email} role string: ${user.role}`);
        }
      }
    }

    console.log('Seeding and migration completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    await dataSource.destroy();
  }
}

seed();
