const { Client } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

function uuidv4() {
  return crypto.randomUUID();
}

async function fix() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  try {
    await client.connect();
    console.log('✓ Connected to database');

    const adminRoleDef = {
      name: 'Admin',
      isSystem: false,
      permissions: [
        'settings:general', 'settings:academic_setup', 'settings:roles_permissions', 'settings:manage_users',
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
    };

    const rolesToSync = [
        adminRoleDef,
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
        }
    ];

    for (const r of rolesToSync) {
        let roleRes = await client.query('SELECT id FROM roles WHERE name = $1', [r.name]);
        let roleId;
        if (roleRes.rows.length === 0) {
            roleId = uuidv4();
            await client.query('INSERT INTO roles (id, name, description, "isSystem") VALUES ($1, $2, $3, $4)', 
                [roleId, r.name, `${r.name} access`, r.isSystem]);
            console.log(`+ Created role: ${r.name}`);
        } else {
            roleId = roleRes.rows[0].id;
            await client.query('UPDATE roles SET "isSystem" = $1 WHERE id = $2', [r.isSystem, roleId]);
            console.log(`~ Updated role: ${r.name}`);
        }

        // Clear and Sync permissions
        await client.query('DELETE FROM role_permissions WHERE "roleId" = $1', [roleId]);
        const permRes = await client.query('SELECT id FROM permissions WHERE slug = ANY($1)', [r.permissions]);
        for (const pRow of permRes.rows) {
            await client.query('INSERT INTO role_permissions ("roleId", "permissionId") VALUES ($1, $2) ON CONFLICT DO NOTHING', 
                [roleId, pRow.id]);
        }
        console.log(`✓ Synced ${permRes.rows.length} original permissions to ${r.name}`);
    }

    console.log('\n✅ ALL ROLES RESTORED & PERMISSIONS SYNCED TO ORIGINAL PROJECT STATE.');

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await client.end();
  }
}

fix();
