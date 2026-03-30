import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function repair() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();

    // 1. Seed Permissions
    const permissions = [
      { slug: 'academics:manage_classes', name: 'Manage Classes', module: 'Academics' },
      { slug: 'academics:manage_subjects', name: 'Manage Subjects', module: 'Academics' },
      { slug: 'academics:assign_teachers', name: 'Assign Teachers', module: 'Academics' },
      { slug: 'academics:view_timetable', name: 'View Timetable', module: 'Academics' },
      { slug: 'academics:manage_timetable', name: 'Manage Timetable', module: 'Academics' },
      { slug: 'academics:promote_students', name: 'Promote Students', module: 'Academics' },
      { slug: 'students:view_directory', name: 'View Student Directory', module: 'Students' },
      { slug: 'students:view_profile', name: 'View Student Profile', module: 'Students' },
      { slug: 'students:create', name: 'Create Students', module: 'Students' },
      { slug: 'students:edit', name: 'Edit Students', module: 'Students' },
      { slug: 'students:manage_categories', name: 'Manage Student Categories', module: 'Students' },
      { slug: 'hr:manage_staff', name: 'Manage Staff', module: 'HR' },
      { slug: 'hr:manage_departments', name: 'Manage Departments', module: 'HR' },
      { slug: 'hr:manage_attendance', name: 'Manage Staff Attendance', module: 'HR' },
      { slug: 'hr:manage_payroll', name: 'Manage Payroll', module: 'HR' },
      { slug: 'hr:manage_leave', name: 'Manage Leaves', module: 'HR' },
      { slug: 'attendance:mark', name: 'Mark Student Attendance', module: 'Attendance' },
      { slug: 'attendance:view_history', name: 'View Attendance History', module: 'Attendance' },
      { slug: 'attendance:view_reports', name: 'View Attendance Reports', module: 'Attendance' },
      { slug: 'homework:view', name: 'View Homework', module: 'Homework' },
      { slug: 'homework:create', name: 'Create Homework', module: 'Homework' },
      { slug: 'homework:evaluate', name: 'Evaluate Homework', module: 'Homework' },
      { slug: 'online_classes:manage', name: 'Manage Online Classes', module: 'Online Classes' },
      { slug: 'online_classes:history', name: 'View Online Class History', module: 'Online Classes' },
      { slug: 'finance:collect_fees', name: 'Collect Fees', module: 'Finance' },
      { slug: 'finance:view_payments', name: 'View Payments', module: 'Finance' },
      { slug: 'finance:view_reports', name: 'View Finance Reports', module: 'Finance' },
      { slug: 'finance:manage_fee_structure', name: 'Manage Fee Structure', module: 'Finance' },
      { slug: 'finance:manage_reminders', name: 'Manage Fee Reminders', module: 'Finance' },
      { slug: 'library:view_books', name: 'View Books', module: 'Library' },
      { slug: 'library:manage_books', name: 'Manage Books', module: 'Library' },
      { slug: 'library:issue_return', name: 'Issue/Return Books', module: 'Library' },
      { slug: 'library:view_reports', name: 'View Library Reports', module: 'Library' },
      { slug: 'exams:manage_setup', name: 'Manage Exam Setup', module: 'Exams' },
      { slug: 'exams:manage_schedule', name: 'Manage Exam Schedule', module: 'Exams' },
      { slug: 'exams:manage_admit_cards', name: 'Manage Admit Cards', module: 'Exams' },
      { slug: 'exams:enter_marks', name: 'Enter Exam Marks', module: 'Exams' },
      { slug: 'exams:manage_domains', name: 'Manage Domains/Traits', module: 'Exams' },
      { slug: 'exams:view_reports', name: 'View Exam Reports', module: 'Exams' },
      { slug: 'exams:process_results', name: 'Process Results', module: 'Exams' },
      { slug: 'settings:general', name: 'General Settings', module: 'Settings' },
      { slug: 'settings:academic_setup', name: 'Academic Setup', module: 'Settings' },
      { slug: 'settings:roles_permissions', name: 'Manage Roles & Permissions', module: 'Settings' },
      { slug: 'settings:users', name: 'Manage Users', module: 'Settings' },
    ];

    console.log('🌱 Seeding permissions...');
    for (const p of permissions) {
      await client.query(
        `INSERT INTO permissions (id, slug, name, module, description) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (slug) DO UPDATE SET name = $3, module = $4`,
        [uuidv4(), p.slug, p.name, p.module, '']
      );
    }

    // 2. Define standard roles and their assigned permission slugs
    const roleMappings = [
      {
        name: 'Teacher',
        isSystem: false,
        permissions: [
          'academics:view_timetable', 'students:view_directory', 'students:view_profile',
          'attendance:mark', 'attendance:view_history', 'homework:view', 'homework:create',
          'homework:evaluate', 'online_classes:manage', 'online_classes:history',
          'exams:enter_marks', 'exams:view_reports'
        ]
      },
      {
        name: 'Accountant',
        isSystem: false,
        permissions: [
          'finance:collect_fees', 'finance:view_payments', 'finance:view_reports',
          'finance:manage_fee_structure', 'hr:manage_payroll'
        ]
      },
      {
        name: 'Librarian',
        isSystem: false,
        permissions: [
          'library:view_books', 'library:manage_books', 'library:issue_return', 'library:view_reports'
        ]
      },
      {
        name: 'Registrar',
        isSystem: false,
        permissions: [
          'academics:manage_classes', 'academics:manage_subjects', 'academics:assign_teachers',
          'students:view_directory', 'students:view_profile', 'students:create', 'students:edit',
          'students:manage_categories', 'hr:manage_staff', 'hr:manage_departments'
        ]
      },
      {
        name: 'Admin',
        isSystem: false,
        permissions: [
          'settings:general', 'settings:academic_setup', 'settings:roles_permissions', 'settings:users',
          'academics:manage_classes', 'academics:manage_subjects', 'academics:assign_teachers',
          'academics:view_timetable', 'academics:manage_timetable', 'academics:promote_students',
          'students:view_directory', 'students:view_profile', 'students:create', 'students:edit',
          'students:manage_categories', 'hr:manage_staff', 'hr:manage_departments', 'hr:manage_attendance',
          'hr:manage_payroll', 'hr:manage_leave', 'attendance:mark', 'attendance:view_history',
          'attendance:view_reports', 'homework:view', 'homework:create', 'homework:evaluate',
          'online_classes:manage', 'online_classes:history', 'library:view_books', 'library:manage_books',
          'library:issue_return', 'library:view_reports', 'finance:collect_fees', 'finance:view_payments',
          'finance:view_reports', 'finance:manage_fee_structure', 'finance:manage_reminders',
          'exams:manage_setup', 'exams:manage_schedule', 'exams:manage_admit_cards', 'exams:enter_marks',
          'exams:manage_domains', 'exams:view_reports', 'exams:process_results'
        ]
      }
    ];

    console.log('🛠 Updating roles and linking permissions...');
    for (const r of roleMappings) {
      // Create or update role
      let roleRes = await client.query('SELECT id FROM roles WHERE name = $1', [r.name]);
      let roleId;
      
      if (roleRes.rows.length === 0) {
        console.log(`+ Creating missing role: ${r.name}`);
        roleId = uuidv4();
        await client.query(
          'INSERT INTO roles (id, name, description, "isSystem") VALUES ($1, $2, $3, $4)',
          [roleId, r.name, `${r.name} role`, r.isSystem]
        );
      } else {
        roleId = roleRes.rows[0].id;
        console.log(`~ Updating existing role: ${r.name}`);
        await client.query('UPDATE roles SET "isSystem" = $1 WHERE id = $2', [r.isSystem, roleId]);
      }

      // Clear existing permissions for this role to ensure fresh sync
      await client.query('DELETE FROM role_permissions WHERE "roleId" = $1', [roleId]);

      // Link new permissions
      const permRes = await client.query('SELECT id FROM permissions WHERE slug = ANY($1)', [r.permissions]);
      for (const pRow of permRes.rows) {
        await client.query(
          'INSERT INTO role_permissions ("roleId", "permissionId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [roleId, pRow.id]
        );
      }
      console.log(`✓ Linked ${permRes.rows.length} permissions to ${r.name}`);
    }

    console.log('🚀 REPAIR COMPLETE. Standard roles are now editable and "Admin" role is restored.');

  } catch (err) {
    console.error('REPAIR ERROR:', err);
  } finally {
    await client.end();
  }
}

repair();
