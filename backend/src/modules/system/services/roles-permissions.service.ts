import { Injectable, NotFoundException, OnModuleInit, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from '../../auth/entities/role.entity';
import { Permission } from '../../auth/entities/permission.entity';
import { CreateRoleDto, UpdateRoleDto } from '../dtos/roles.dto';

@Injectable()
export class RolesPermissionsService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}
  
  async onModuleInit() {
    await this.renameAdminToSuperAdmin();
    await this.seedDefaultRoles();
    await this.seedSelfServicePermissions();
    await this.seedLibraryPermissions();
  }

  private async seedLibraryPermissions() {
    const perms = [
      { slug: 'library:books:create', name: 'Create Books', module: 'Library' },
      { slug: 'library:books:read', name: 'Read Books', module: 'Library' },
      { slug: 'library:books:update', name: 'Update Books', module: 'Library' },
      { slug: 'library:books:delete', name: 'Delete Books', module: 'Library' },
      { slug: 'library:loans:issue', name: 'Issue Loans', module: 'Library' },
      { slug: 'library:loans:return', name: 'Return Loans', module: 'Library' },
      { slug: 'library:fines:manage', name: 'Manage Fines', module: 'Library' },
      { slug: 'library:reports:view', name: 'View Library Reports', module: 'Library' },
    ];

    for (const p of perms) {
      await this.createPermission(p.slug, p.name, p.module);
    }

    // Assign sensible defaults: Super Administrator already has all permissions via seeding elsewhere
    const principalRole = await this.roleRepository.findOne({ where: { name: 'Principal' }, relations: ['permissions'] });
    if (principalRole) {
      const principalPerms = await this.permissionRepository.find({ where: { slug: In(['library:books:read','library:loans:issue','library:loans:return','library:reports:view']) } });
      principalRole.permissions = [...(principalRole.permissions || []), ...principalPerms];
      await this.roleRepository.save(principalRole);
    }

    const teacherRole = await this.roleRepository.findOne({ where: { name: 'Teacher' }, relations: ['permissions'] });
    if (teacherRole) {
      const teacherPerms = await this.permissionRepository.find({ where: { slug: In(['library:books:read','library:loans:issue','library:loans:return']) } });
      teacherRole.permissions = [...(teacherRole.permissions || []), ...teacherPerms];
      await this.roleRepository.save(teacherRole);
    }
  }

  private async renameAdminToSuperAdmin() {
    try {
      const adminRole = await this.roleRepository.findOne({ where: { name: 'Admin' } });
      const superAdminRole = await this.roleRepository.findOne({ where: { name: 'Super Administrator' } });

      if (adminRole) {
        if (superAdminRole) {
          // Both exist, just move users and delete legacy admin
          await this.roleRepository.manager.query(
            `UPDATE users SET role = 'super administrator' WHERE role = 'admin'`
          );
          await this.roleRepository.remove(adminRole);
          console.log('✓ Merged legacy "Admin" role into existing "Super Administrator"');
        } else {
          // Only legacy exists, rename it
          adminRole.name = 'Super Administrator';
          adminRole.description = 'Complete system access and management';
          adminRole.isSystem = true;
          await this.roleRepository.save(adminRole);
          
          await this.roleRepository.manager.query(
            `UPDATE users SET role = 'super administrator' WHERE role = 'admin'`
          );
          console.log('✓ Renamed legacy "Admin" role to "Super Administrator"');
        }
      }
    } catch (error) {
      console.error('Error migrating legacy admin role:', error);
    }
  }

  private async seedDefaultRoles() {
    const defaultRoles = [
      { name: 'Super Administrator', description: 'Complete system access and management', isSystem: true },
      { name: 'Student', description: 'Regular student access', isSystem: true },
      { name: 'Parent', description: 'Parent/Guardian access', isSystem: true },
    ];

    for (const roleData of defaultRoles) {
      const existing = await this.roleRepository.findOne({ where: { name: roleData.name } });
      if (!existing) {
        console.log(`🌱 Seeding default role: ${roleData.name}`);
        const role = this.roleRepository.create(roleData);
        await this.roleRepository.save(role);
      }
    }
  }

  private async seedSelfServicePermissions() {
    const studentPermissions = [
      { slug: 'students:view_self', name: 'View Own Profile', module: 'Students' },
      { slug: 'finance:view_self_fees', name: 'View Own Fees', module: 'Finance' },
      { slug: 'exams:view_self_results', name: 'View Own Results', module: 'Examination' },
    ];

    const parentPermissions = [
      { slug: 'students:view_children', name: 'View Children Profiles', module: 'Students' },
      { slug: 'finance:view_children_fees', name: 'View Children Fees', module: 'Finance' },
      { slug: 'exams:view_children_results', name: 'View Children Results', module: 'Examination' },
    ];

    const allSelfService = [...studentPermissions, ...parentPermissions];
    for (const p of allSelfService) {
      await this.createPermission(p.slug, p.name, p.module);
    }

    // Assign to Student Role
    const studentRole = await this.roleRepository.findOne({ where: { name: 'Student' }, relations: ['permissions'] });
    if (studentRole) {
      const perms = await this.permissionRepository.find({
        where: { slug: In(['students:view_self', 'finance:view_self_fees', 'exams:view_self_results', 'academics:view_timetable', 'communication:notice_board']) }
      });
      studentRole.permissions = perms;
      await this.roleRepository.save(studentRole);
    }

    // Assign to Parent Role
    const parentRole = await this.roleRepository.findOne({ where: { name: 'Parent' }, relations: ['permissions'] });
    if (parentRole) {
      const perms = await this.permissionRepository.find({
        where: { slug: In(['students:view_children', 'finance:view_children_fees', 'exams:view_children_results', 'communication:notice_board']) }
      });
      parentRole.permissions = perms;
      await this.roleRepository.save(parentRole);
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
    if (role.isSystem) {
      throw new Error('System roles cannot be deleted');
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
