import { DataSource } from 'typeorm';
import { Role } from '../../modules/auth/entities/role.entity';
import { Permission } from '../../modules/auth/entities/permission.entity';

export const seedRoles = async (dataSource: DataSource) => {
  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);

  const roles = [
    { name: 'Super Administrator', description: 'Complete system access and management', isSystem: true, permissions: 'all' },
    { name: 'Admin', description: 'General administration', isSystem: true, permissions: ['students:view_directory', 'hr:manage_staff', 'communication:view_notices', 'communication:manage_notices', 'communication:send_broadcast', 'communication:manage_templates', 'communication:view_logs', 'audit_reports:view', 'front_cms:manage'] },
    { name: 'Teacher', description: 'Access to classroom management and academics', isSystem: false, permissions: ['academics:view_timetable', 'attendance:mark', 'homework:create', 'homework:evaluate', 'exams:enter_marks', 'communication:view_notices'] },
    { name: 'Staff', description: 'General staff access', isSystem: false, permissions: ['communication:view_notices'] },
    { name: 'Student', description: 'Access to personal academic records and notices', isSystem: false, permissions: ['communication:view_notices', 'academics:view_timetable', 'attendance:view_history', 'homework:view', 'library:view_books', 'exams:view_reports'] },
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
