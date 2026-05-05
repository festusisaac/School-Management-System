import { DataSource } from 'typeorm';
import { Role } from '../../modules/auth/entities/role.entity';
import { Permission } from '../../modules/auth/entities/permission.entity';

export const seedRoles = async (dataSource: DataSource) => {
  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);

  const roles = [
    { name: 'Super Administrator', description: 'Complete system access and management', isSystem: true, permissions: 'all' },
    { name: 'Admin', description: 'School administrator with broad oversight of academics, students, and human resources.', isSystem: true, permissions: ['settings:general', 'settings:academic_setup', 'academics:manage_classes', 'academics:manage_subjects', 'academics:assign_teachers', 'academics:view_timetable', 'academics:manage_timetable', 'academics:promote_students', 'students:view_directory', 'students:view_profile', 'students:create', 'students:edit', 'students:manage_categories', 'hr:manage_staff', 'hr:manage_departments', 'hr:manage_attendance', 'hr:manage_payroll', 'hr:manage_leave', 'attendance:mark', 'attendance:view_history', 'attendance:view_reports', 'homework:view', 'homework:create', 'homework:evaluate', 'online_classes:manage', 'online_classes:history', 'library:view_books', 'library:manage_books', 'library:issue_return', 'library:view_reports', 'finance:collect_fees', 'finance:view_payments', 'finance:view_reports', 'finance:manage_fee_structure', 'finance:manage_reminders', 'expenses:view', 'expenses:view_reports', 'expenses:manage_categories', 'expenses:manage_vendors', 'expenses:manage_records', 'exams:manage_setup', 'exams:manage_schedule', 'exams:manage_admit_cards', 'exams:enter_marks', 'exams:manage_domains', 'exams:view_reports', 'exams:process_results', 'audit_reports:view', 'front_cms:manage', 'donations:view', 'donations:manage_projects', 'download_center:view', 'download_center:manage', 'lesson_notes:view', 'lesson_notes:manage', 'lesson_notes:approve'] },
    { name: 'Accountant', description: 'Financial operations, expenses, fee collection, and reminders', isSystem: false, permissions: ['communication:view_notices', 'finance:collect_fees', 'finance:view_payments', 'finance:view_reports', 'finance:manage_fee_structure', 'finance:manage_reminders', 'hr:manage_payroll', 'expenses:view', 'expenses:view_reports', 'expenses:manage_categories', 'expenses:manage_vendors', 'expenses:manage_records', 'download_center:view', 'lesson_notes:view'] },
    { name: 'Librarian', description: 'Manages school library, books, and circulation', isSystem: false, permissions: ['communication:view_notices', 'library:view_books', 'library:manage_books', 'library:issue_return', 'library:view_reports', 'download_center:view', 'lesson_notes:view'] },
    { name: 'Teacher', description: 'Access to classroom management and academics', isSystem: false, permissions: ['academics:view_timetable', 'attendance:mark', 'homework:create', 'homework:evaluate', 'exams:enter_marks', 'communication:view_notices', 'download_center:view', 'download_center:manage', 'lesson_notes:view', 'lesson_notes:manage'] },
    { name: 'Staff', description: 'General staff access', isSystem: false, permissions: ['communication:view_notices', 'download_center:view', 'lesson_notes:view'] },
    { name: 'Student', description: 'Access to personal academic records and notices', isSystem: false, permissions: ['communication:view_notices', 'academics:view_timetable', 'attendance:view_history', 'homework:view', 'library:view_books', 'exams:view_reports', 'download_center:view'] },
  ];

  const allPermissions = await permissionRepository.find();

  for (const roleData of roles) {
    let role = await roleRepository.findOne({ 
      where: { name: roleData.name },
      relations: ['permissions'] 
    });

    const targetPermissions = roleData.permissions === 'all' 
      ? allPermissions 
      : allPermissions.filter(p => (roleData.permissions as string[]).includes(p.slug));

    if (!role) {
      role = roleRepository.create({
        name: roleData.name,
        description: roleData.description,
        isSystem: roleData.isSystem,
        permissions: targetPermissions
      });
      await roleRepository.save(role);
      console.log(`✓ Created role: ${roleData.name} with ${targetPermissions.length} permissions`);
    } else {
      role.permissions = targetPermissions;
      await roleRepository.save(role);
      console.log(`✓ Updated role: ${roleData.name} with ${targetPermissions.length} permissions`);
    }
  }

  console.log('✓ Roles seeded (Super Admin, Teacher, Student)');
};
