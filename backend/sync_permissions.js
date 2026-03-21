const { Client } = require('pg');
require('dotenv').config();

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
  { slug: 'exams:enter_marks', name: 'Enter Marks', module: 'Examination' },
  { slug: 'exams:publish_results', name: 'Publish Results', module: 'Examination' },

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

async function syncPermissions() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  try {
    await client.connect();
    console.log('✅ Connection successful!');

    for (const p of permissionsData) {
      const res = await client.query('SELECT id FROM permissions WHERE slug = $1', [p.slug]);
      if (res.rows.length === 0) {
        await client.query(
          'INSERT INTO permissions (id, slug, name, module, "createdAt", "updatedAt") VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), NOW())',
          [p.slug, p.name, p.module]
        );
        console.log(`➕ Added permission: ${p.slug}`);
      } else {
        // Update module name and name if it exists to ensure sync
        await client.query(
          'UPDATE permissions SET name = $1, module = $2, "updatedAt" = NOW() WHERE slug = $3',
          [p.name, p.module, p.slug]
        );
        console.log(`🔄 Updated permission: ${p.slug}`);
      }
    }

    console.log('✅ Sync completed!');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

syncPermissions();
