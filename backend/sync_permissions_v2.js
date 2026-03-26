/**
 * Sync Permissions Script v2
 * Removes obsolete permissions and adds new ones.
 */
const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

const NEW_PERMISSIONS = [
  { slug: 'students:view', name: 'View Students', module: 'Students' },
  { slug: 'students:create', name: 'Create Student', module: 'Students' },
  { slug: 'students:edit', name: 'Edit Student', module: 'Students' },
  { slug: 'students:delete', name: 'Delete Student', module: 'Students' },
  { slug: 'students:promote', name: 'Promote Students', module: 'Students' },
  { slug: 'attendance:mark', name: 'Mark Student Attendance', module: 'Student Attendance' },
  { slug: 'attendance:view_reports', name: 'View Attendance Reports', module: 'Student Attendance' },
  { slug: 'academics:manage_sessions', name: 'Manage Sessions & Terms', module: 'Academics' },
  { slug: 'academics:manage_classes', name: 'Manage Classes & Sections', module: 'Academics' },
  { slug: 'academics:manage_subjects', name: 'Manage Subjects', module: 'Academics' },
  { slug: 'academics:assign_teachers', name: 'Assign Class/Subject Teachers', module: 'Academics' },
  { slug: 'academics:manage_timetable', name: 'Manage Timetable', module: 'Academics' },
  { slug: 'exams:manage_setup', name: 'Manage Exam Groups & Assessment Types', module: 'Examination' },
  { slug: 'exams:manage_schedule', name: 'Manage Exam Schedule', module: 'Examination' },
  { slug: 'exams:manage_grades', name: 'Manage Grade Scales', module: 'Examination' },
  { slug: 'exams:enter_marks', name: 'Enter Marks & Scores', module: 'Examination' },
  { slug: 'exams:manage_domains', name: 'Manage Affective/Psychomotor Domains', module: 'Examination' },
  { slug: 'exams:manage_admit_cards', name: 'Manage Admit Cards', module: 'Examination' },
  { slug: 'exams:process_results', name: 'Process / Approve / Publish / Withhold Results', module: 'Examination' },
  { slug: 'exams:view_reports', name: 'View Broadsheet & Report Cards', module: 'Examination' },
  { slug: 'finance:manage_fee_structure', name: 'Manage Fee Structure & Discounts', module: 'Finance' },
  { slug: 'finance:collect_fees', name: 'Record Payments', module: 'Finance' },
  { slug: 'finance:view_reports', name: 'View Financial Reports & Debtors', module: 'Finance' },
  { slug: 'finance:manage_reminders', name: 'Send Payment Reminders', module: 'Finance' },
  { slug: 'hr:manage_staff', name: 'Manage Staff Directory', module: 'HR' },
  { slug: 'hr:manage_payroll', name: 'Manage Payroll', module: 'HR' },
  { slug: 'hr:manage_attendance', name: 'Staff Attendance', module: 'HR' },
  { slug: 'hr:manage_leave', name: 'Manage Leave Types & Approvals', module: 'HR' },
  { slug: 'hr:manage_departments', name: 'Manage Departments', module: 'HR' },
  { slug: 'library:manage_books', name: 'Manage Books (Add/Edit/Delete)', module: 'Library' },
  { slug: 'library:issue_return', name: 'Issue & Return Books', module: 'Library' },
  { slug: 'library:view_reports', name: 'View Library Reports', module: 'Library' },
  { slug: 'settings:general', name: 'General Settings', module: 'Settings' },
  { slug: 'settings:roles_permissions', name: 'Roles & Permissions', module: 'Settings' },
  { slug: 'settings:manage_users', name: 'Manage Users', module: 'Settings' },
];

const OBSOLETE_SLUGS = [
  'dormitory:manage_hostels', 'dormitory:manage_rooms', 'dormitory:assign_rooms',
  'communication:send_sms', 'communication:send_email', 'communication:notice_board',
  'reports:attendance', 'reports:academic', 'reports:financial',
  'settings:backups',
  'academics:manage_terms',
  'finance:view_fees', 'finance:manage_expenses', 'finance:reports',
  'exams:publish_results',
  'library:view_books',
  'library:books:create', 'library:books:read', 'library:books:update', 'library:books:delete',
  'library:loans:issue', 'library:loans:return', 'library:fines:manage', 'library:reports:view',
];

async function sync() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'sms_db',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Step 1: Get IDs of obsolete permissions
    const obsoleteIds = [];
    for (const slug of OBSOLETE_SLUGS) {
      const res = await client.query('SELECT id FROM permissions WHERE slug = $1', [slug]);
      if (res.rows.length > 0) obsoleteIds.push(res.rows[0].id);
    }

    if (obsoleteIds.length > 0) {
      // Remove from junction table first
      for (const id of obsoleteIds) {
        await client.query('DELETE FROM role_permissions WHERE "permissionId" = $1', [id]);
      }
      // Remove the permissions
      for (const id of obsoleteIds) {
        await client.query('DELETE FROM permissions WHERE id = $1', [id]);
      }
      console.log(`✓ Removed ${obsoleteIds.length} obsolete permissions`);
    } else {
      console.log('No obsolete permissions found');
    }

    // Step 2: Upsert new permissions
    let created = 0, updated = 0;
    for (const perm of NEW_PERMISSIONS) {
      const existing = await client.query('SELECT id, name, module FROM permissions WHERE slug = $1', [perm.slug]);
      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO permissions (id, slug, name, module, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())`,
          [perm.slug, perm.name, perm.module]
        );
        created++;
      } else if (existing.rows[0].name !== perm.name || existing.rows[0].module !== perm.module) {
        await client.query(
          'UPDATE permissions SET name = $1, module = $2 WHERE slug = $3',
          [perm.name, perm.module, perm.slug]
        );
        updated++;
      }
    }
    console.log(`✓ Created ${created} new permissions, updated ${updated} existing`);

    // Step 3: Assign all permissions to Super Administrator
    const adminRes = await client.query("SELECT id FROM roles WHERE name = 'Super Administrator'");
    if (adminRes.rows.length > 0) {
      const adminId = adminRes.rows[0].id;
      const allPerms = await client.query('SELECT id FROM permissions');
      for (const perm of allPerms.rows) {
        await client.query(
          `INSERT INTO role_permissions ("roleId", "permissionId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [adminId, perm.id]
        );
      }
      console.log(`✓ Assigned all permissions to Super Administrator`);
    }

    // Summary
    const finalCount = await client.query('SELECT module, COUNT(*) as count FROM permissions GROUP BY module ORDER BY module');
    console.log('\n✅ Permission sync complete!\n');
    console.log('Final Summary:');
    finalCount.rows.forEach(r => console.log(`  ${r.module}: ${r.count} permissions`));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

sync();
