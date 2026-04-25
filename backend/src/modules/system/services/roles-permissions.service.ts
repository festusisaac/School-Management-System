import { Injectable, NotFoundException, OnModuleInit, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from '../../auth/entities/role.entity';
import { Permission } from '../../auth/entities/permission.entity';
import { CreateRoleDto, UpdateRoleDto } from '../dtos/roles.dto';

@Injectable()
export class RolesPermissionsService implements OnModuleInit {
  private readonly protectedRoleNames = new Set(['Admin', 'Teacher', 'Accountant', 'Librarian']);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}
  
  async onModuleInit() {
    await this.ensureCorePermissions();
    await this.seedDefaultRoles();
  }

  private async seedDefaultRoles() {
    // Ensure Super Administrator role exists
    let superAdminRole = await this.roleRepository.findOne({
      where: { name: 'Super Administrator' },
      relations: ['permissions'],
    });

    if (!superAdminRole) {
      console.log('🌱 Seeding default role: Super Administrator');
      superAdminRole = this.roleRepository.create({
        name: 'Super Administrator',
        description: 'Complete system access and management',
        isSystem: true,
      });
      superAdminRole = await this.roleRepository.save(superAdminRole);
    }

    // Always sync: give Super Administrator ALL permissions
    const allPermissions = await this.permissionRepository.find();
    if (allPermissions.length > 0) {
      superAdminRole.permissions = allPermissions;
      await this.roleRepository.save(superAdminRole);
      console.log(`✓ Super Administrator synced with ${allPermissions.length} permissions`);
    }
  }

  private async ensureCorePermissions() {
    const allPermissions = [
      // Settings
      { slug: 'settings:general', name: 'General Settings', module: 'Settings', description: 'Manage general system settings' },
      { slug: 'settings:academic_setup', name: 'Academic Setup', module: 'Settings', description: 'Manage academic configuration' },

      // Academics
      { slug: 'academics:manage_classes', name: 'Manage Classes', module: 'Academics', description: 'Create, edit, and delete classes' },
      { slug: 'academics:manage_subjects', name: 'Manage Subjects', module: 'Academics', description: 'Create, edit, and delete subjects' },
      { slug: 'academics:assign_teachers', name: 'Assign Teachers', module: 'Academics', description: 'Assign teachers to classes and subjects' },
      { slug: 'academics:view_timetable', name: 'View Timetable', module: 'Academics', description: 'View class timetables' },
      { slug: 'academics:manage_timetable', name: 'Manage Timetable', module: 'Academics', description: 'Create and edit timetables' },
      { slug: 'academics:promote_students', name: 'Promote Students', module: 'Academics', description: 'Promote students to next class' },

      // Students
      { slug: 'students:view_directory', name: 'View Student Directory', module: 'Students', description: 'View list of all students' },
      { slug: 'students:view_profile', name: 'View Student Profile', module: 'Students', description: 'View individual student profiles' },
      { slug: 'students:create', name: 'Create Student', module: 'Students', description: 'Admit new students' },
      { slug: 'students:edit', name: 'Edit Student', module: 'Students', description: 'Edit student records' },
      { slug: 'students:manage_categories', name: 'Manage Student Categories', module: 'Students', description: 'Manage student categories' },

      // Attendance
      { slug: 'attendance:mark', name: 'Mark Attendance', module: 'Attendance', description: 'Mark student attendance' },
      { slug: 'attendance:view_history', name: 'View Attendance History', module: 'Attendance', description: 'View attendance records' },
      { slug: 'attendance:view_reports', name: 'View Attendance Reports', module: 'Attendance', description: 'View attendance reports and analytics' },

      // Homework
      { slug: 'homework:view', name: 'View Homework', module: 'Homework', description: 'View homework assignments' },
      { slug: 'homework:create', name: 'Create Homework', module: 'Homework', description: 'Create homework assignments' },
      { slug: 'homework:evaluate', name: 'Evaluate Homework', module: 'Homework', description: 'Grade and evaluate homework' },

      // Online Classes
      { slug: 'online_classes:manage', name: 'Manage Online Classes', module: 'Online Classes', description: 'Schedule and manage online classes' },
      { slug: 'online_classes:history', name: 'Online Class History', module: 'Online Classes', description: 'View online class history' },

      // Communication
      { slug: 'communication:view_notices', name: 'View Notices', module: 'Communication', description: 'View notice board' },

      // HR
      { slug: 'hr:manage_staff', name: 'Manage Staff', module: 'Human Resources', description: 'Create, edit, and manage staff records' },
      { slug: 'hr:manage_departments', name: 'Manage Departments', module: 'Human Resources', description: 'Create and manage departments' },
      { slug: 'hr:manage_attendance', name: 'Manage Staff Attendance', module: 'Human Resources', description: 'Mark and view staff attendance' },
      { slug: 'hr:manage_payroll', name: 'Manage Payroll', module: 'Human Resources', description: 'Process and manage payroll' },
      { slug: 'hr:manage_leave', name: 'Manage Leave', module: 'Human Resources', description: 'Approve and manage leave requests' },

      // Finance
      { slug: 'finance:collect_fees', name: 'Collect Fees', module: 'Finance', description: 'Record fee payments' },
      { slug: 'finance:view_payments', name: 'View Payments', module: 'Finance', description: 'View payment records' },
      { slug: 'finance:view_reports', name: 'View Financial Reports', module: 'Finance', description: 'View financial reports and analytics' },
      { slug: 'finance:manage_fee_structure', name: 'Manage Fee Structure', module: 'Finance', description: 'Create and manage fee structures' },
      { slug: 'finance:manage_reminders', name: 'Manage Reminders', module: 'Finance', description: 'Send and manage fee reminders' },

      // Expenses
      { slug: 'expenses:view', name: 'View Expenses', module: 'Expenses', description: 'View expense records' },
      { slug: 'expenses:view_reports', name: 'View Expense Reports', module: 'Expenses', description: 'View expense analytics' },
      { slug: 'expenses:manage_categories', name: 'Manage Expense Categories', module: 'Expenses', description: 'Create and edit expense categories' },
      { slug: 'expenses:manage_vendors', name: 'Manage Vendors', module: 'Expenses', description: 'Create and edit vendors' },
      { slug: 'expenses:manage_records', name: 'Manage Expense Records', module: 'Expenses', description: 'Create, edit, and delete expenses' },

      // Library
      { slug: 'library:view_books', name: 'View Books', module: 'Library', description: 'View library catalog' },
      { slug: 'library:manage_books', name: 'Manage Books', module: 'Library', description: 'Add, edit, and remove books' },
      { slug: 'library:issue_return', name: 'Issue & Return Books', module: 'Library', description: 'Issue and return library books' },
      { slug: 'library:view_reports', name: 'View Library Reports', module: 'Library', description: 'View library analytics' },

      // Examinations
      { slug: 'exams:manage_setup', name: 'Manage Exam Setup', module: 'Examinations', description: 'Configure exam settings and assessment structures' },
      { slug: 'exams:manage_schedule', name: 'Manage Exam Schedule', module: 'Examinations', description: 'Create and manage exam schedules' },
      { slug: 'exams:manage_admit_cards', name: 'Manage Admit Cards', module: 'Examinations', description: 'Generate and manage admit cards' },
      { slug: 'exams:enter_marks', name: 'Enter Marks', module: 'Examinations', description: 'Enter and edit exam marks' },
      { slug: 'exams:manage_domains', name: 'Manage Assessment Domains', module: 'Examinations', description: 'Manage psychomotor and skill domains' },
      { slug: 'exams:view_reports', name: 'View Exam Reports', module: 'Examinations', description: 'View report cards and broadsheets' },
      { slug: 'exams:process_results', name: 'Process Results', module: 'Examinations', description: 'Process and publish exam results' },

      // Front CMS
      { slug: 'front_cms:manage', name: 'Manage Front CMS', module: 'Front CMS', description: 'Manage website content, media, contacts, and public-facing CMS sections' },

      // Audit & Reports
      { slug: 'audit_reports:view', name: 'Audit & Reports Module', module: 'Audit & Reports', description: 'Access audit dashboards, activity logs, communication audit, and report hub' },
    ];

    for (const perm of allPermissions) {
      await this.createPermission(perm.slug, perm.name, perm.module, perm.description);
    }
  }

  async findAllRoles(): Promise<Role[]> {
    return this.roleRepository.find({ relations: ['permissions'] });
  }

  async findOneRole(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }
    return role;
  }

  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    const { permissionIds, ...roleData } = createRoleDto;

    // Check if role name already exists
    const existingRole = await this.roleRepository.findOne({ where: { name: roleData.name } });
    if (existingRole) {
      throw new ConflictException(`Role with name "${roleData.name}" already exists`);
    }

    const permissions = permissionIds
      ? await this.permissionRepository.find({ where: { id: In(permissionIds) } })
      : [];

    const role = this.roleRepository.create({
      ...roleData,
      permissions,
    });

    return this.roleRepository.save(role);
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const { permissionIds, ...roleData } = updateRoleDto;
    const role = await this.findOneRole(id);

    if (role.isSystem && roleData.name && roleData.name !== role.name) {
       // Optional: Prevent renaming system roles
    }

    if (permissionIds) {
      role.permissions = await this.permissionRepository.find({
        where: { id: In(permissionIds) },
      });
    }

    Object.assign(role, roleData);
    return this.roleRepository.save(role);
  }

  async deleteRole(id: string): Promise<void> {
    const role = await this.findOneRole(id);
    if (role.isSystem || this.protectedRoleNames.has(role.name)) {
      throw new ConflictException(`${role.name} cannot be deleted`);
    }
    await this.roleRepository.remove(role);
  }

  async findAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find();
  }

  // Helper for seeding or initial setup
  async createPermission(slug: string, name: string, module: string, description?: string): Promise<Permission> {
    let permission = await this.permissionRepository.findOne({ where: { slug } });
    if (!permission) {
        permission = this.permissionRepository.create({ slug, name, module, description });
        await this.permissionRepository.save(permission);
    }
    return permission;
  }
}
