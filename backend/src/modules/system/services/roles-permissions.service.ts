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
  }

  // Library permissions now managed in seed-roles-permissions.ts
  // Student/Parent access is handled by account type, not role-based permissions

  private async renameAdminToSuperAdmin() {
    try {
      const adminRole = await this.roleRepository.findOne({ where: { name: 'Admin' } });
      const superAdminRole = await this.roleRepository.findOne({ where: { name: 'Super Administrator' } });

      if (adminRole) {
        if (superAdminRole) {
          await this.roleRepository.manager.query(
            `UPDATE users SET role = 'super administrator' WHERE role = 'admin'`
          );
          await this.roleRepository.remove(adminRole);
          console.log('✓ Merged legacy "Admin" role into existing "Super Administrator"');
        } else {
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
