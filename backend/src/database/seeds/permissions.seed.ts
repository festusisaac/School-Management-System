import { DataSource } from 'typeorm';
import { Permission } from '../../modules/auth/entities/permission.entity';

export const seedPermissions = async (dataSource: DataSource) => {
  const permissionRepository = dataSource.getRepository(Permission);

  const permissions = [
    // Settings
    { slug: 'settings:general', name: 'General Settings', module: 'Settings', description: 'Institutional info, branding, and global configuration' },
    { slug: 'settings:roles_permissions', name: 'Roles & Permissions', module: 'Settings', description: 'Manage user roles and granular access control' },
    { slug: 'settings:manage_users', name: 'User Management', module: 'Settings', description: 'Manage system login accounts and passwords' },
    { slug: 'settings:academic_setup', name: 'Academic Setup & Sessions', module: 'Settings', description: 'Configure school structure, divisions (Primary/Secondary), academic years, and terms' },

    // Academics
    { slug: 'academics:manage_classes', name: 'Manage Classes & Sections', module: 'Academics', description: 'Setup grade levels and class divisions' },
    { slug: 'academics:manage_subjects', name: 'Manage Subjects', module: 'Academics', description: 'Define subjects and group them for classes' },
    { slug: 'academics:assign_teachers', name: 'Assign Teachers', module: 'Academics', description: 'Assign teachers to classes and subjects' },
    { slug: 'academics:view_timetable', name: 'View Timetable', module: 'Academics', description: 'View class and teacher weekly schedules' },
    { slug: 'academics:manage_timetable', name: 'Manage Timetable', module: 'Academics', description: 'Create and edit class/teacher schedules' },
    { slug: 'academics:promote_students', name: 'Promote Students', module: 'Academics', description: 'Move students to the next grade level' },

    // Students
    { slug: 'students:view_directory', name: 'View Student Directory', module: 'Students', description: 'List and browse students' },
    { slug: 'students:view_profile', name: 'View Student Profile', module: 'Students', description: 'Access full student data, records, and history' },
    { slug: 'students:create', name: 'Student Admission', module: 'Students', description: 'Register/Admit new students' },
    { slug: 'students:edit', name: 'Edit Student Details', module: 'Students', description: 'Update existing student information' },
    { slug: 'students:delete', name: 'Delete/Deactivate Students', module: 'Students', description: 'Archive or remove student records' },
    { slug: 'students:manage_categories', name: 'Manage Student Setup', module: 'Students', description: 'Setup categories, houses, and enrollment reasons' },

    // HR
    { slug: 'hr:manage_staff', name: 'Manage Staff Directory', module: 'Human Resource', description: 'Full staff management access' },
    { slug: 'hr:manage_departments', name: 'Manage Departments', module: 'Human Resource', description: 'Setup school staff departments' },
    { slug: 'hr:manage_attendance', name: 'Staff Attendance', module: 'Human Resource', description: 'Mark and track staff daily presence' },
    { slug: 'hr:manage_payroll', name: 'Manage Payroll', module: 'Human Resource', description: 'Generate payslips and manage salaries' },
    { slug: 'hr:manage_leave', name: 'Manage Leaves', module: 'Human Resource', description: 'Review and approve leave requests' },

    // Attendance (Student)
    { slug: 'attendance:mark', name: 'Mark Student Attendance', module: 'Attendance', description: 'Mark daily attendance for students' },
    { slug: 'attendance:view_history', name: 'View Attendance Logs', module: 'Attendance', description: 'Browse past attendance records' },
    { slug: 'attendance:view_reports', name: 'Attendance Reports', module: 'Attendance', description: 'Generate and export attendance summary reports' },

    // Homework
    { slug: 'homework:view', name: 'View Homework Assignments', module: 'Homework', description: 'List and browse given assignments' },
    { slug: 'homework:create', name: 'Create/Delete Homework', module: 'Homework', description: 'Post new assignments to students' },
    { slug: 'homework:evaluate', name: 'Evaluate Submissions', module: 'Homework', description: 'Grade and provide feedback on student work' },

    // Online Classes
    { slug: 'online_classes:manage', name: 'Manage Online Classes', module: 'Online Classes', description: 'Schedule and start virtual classes (Zoom/Meet)' },
    { slug: 'online_classes:history', name: 'View Class History', module: 'Online Classes', description: 'List of completed virtual sessions' },

    // Library
    { slug: 'library:view_books', name: 'View Books Catalog', module: 'Library', description: 'Browse and search available books' },
    { slug: 'library:manage_books', name: 'Manage Books', module: 'Library', description: 'Add, edit, or delete books' },
    { slug: 'library:issue_return', name: 'Issue/Return Books', module: 'Library', description: 'Manage book circulation' },
    { slug: 'library:view_reports', name: 'Library Reports', module: 'Library', description: 'Overdue loans and circulation history' },

    // Finance
    { slug: 'finance:collect_fees', name: 'Collect Fees', module: 'Finance', description: 'Record student fee payments' },
    { slug: 'finance:view_payments', name: 'View Payment History', module: 'Finance', description: 'List of all financial transactions' },
    { slug: 'finance:view_reports', name: 'Financial Reports', module: 'Finance', description: 'Income reports and debtors lists' },
    { slug: 'finance:manage_fee_structure', name: 'Manage Fees Structure', module: 'Finance', description: 'Setup fee groups and discounts' },
    { slug: 'finance:manage_reminders', name: 'Payment Reminders', module: 'Finance', description: 'Send fee alerts via SMS/Email' },

    // Examination
    { slug: 'exams:manage_setup', name: 'Manage Exam Setup', module: 'Examination', description: 'Exam groups and assessment structures' },
    { slug: 'exams:manage_schedule', name: 'Manage Exam Schedules', module: 'Examination', description: 'Setup exam periods and dates' },
    { slug: 'exams:manage_admit_cards', name: 'Manage Admit Cards', module: 'Examination', description: 'Design and print examination ID cards' },
    { slug: 'exams:enter_marks', name: 'Record Exam Scores', module: 'Examination', description: 'Input student marks for exams' },
    { slug: 'exams:manage_domains', name: 'Manage Domains & Skills', module: 'Examination', description: 'Record psychomotor and attribute scores' },
    { slug: 'exams:view_reports', name: 'Examination Reports', module: 'Examination', description: 'Broadsheets and student report cards' },
    { slug: 'exams:process_results', name: 'Process & Publish Results', module: 'Examination', description: 'Manage results visibility and scratch cards' },

    // Communication
    { slug: 'communication:view_notices', name: 'View Noticeboard', module: 'Communication', description: 'View school-wide notices and announcements' },
    { slug: 'communication:manage_notices', name: 'Manage Notices', module: 'Communication', description: 'Create, edit, and delete noticeboard items' },
    { slug: 'communication:send_broadcast', name: 'Send Broadcast', module: 'Communication', description: 'Send Email or SMS broadcasts to students and staff' },
    { slug: 'communication:manage_templates', name: 'Manage Templates', module: 'Communication', description: 'Create and edit reusable communication templates' },
    { slug: 'communication:view_logs', name: 'View Comm Logs', module: 'Communication', description: 'Audit history of sent messages and notifications' },

    // Audit & Reports
    { slug: 'audit_reports:view', name: 'Audit & Reports Module', module: 'Audit & Reports', description: 'Access audit dashboards, activity logs, communication audit, and report hub' },

    { slug: 'front_cms:manage', name: 'Manage Front CMS', module: 'Front CMS', description: 'Manage website content, media, contacts, and public-facing CMS sections' },
  ];

  // Get all current slugs in the database
  const allExistingPermissions = await permissionRepository.find();
  const currentSlugs = permissions.map(p => p.slug);

  // Remove permissions that are no longer in the seed list
  for (const existing of allExistingPermissions) {
    if (!currentSlugs.includes(existing.slug)) {
      await permissionRepository.remove(existing);
      console.log(`- Removed stale permission: ${existing.slug}`);
    }
  }

  // Add or update permissions
  for (const p of permissions) {
    const existing = await permissionRepository.findOne({ where: { slug: p.slug } });
    if (existing) {
      // Update existing permission to ensure name/module/description are in sync
      Object.assign(existing, p);
      await permissionRepository.save(existing);
    } else {
      const permission = permissionRepository.create(p);
      await permissionRepository.save(permission);
    }
  }

  console.log(`✓ Permissions seeded (${permissions.length} items)`);
};
