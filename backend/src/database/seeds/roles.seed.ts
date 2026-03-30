import { DataSource } from 'typeorm';
import { Role } from '../../modules/auth/entities/role.entity';
import { Permission } from '../../modules/auth/entities/permission.entity';

export const seedRoles = async (dataSource: DataSource) => {
  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);

  const roles = [
    { name: 'Super Administrator', description: 'Complete system access and management', isSystem: true },
  ];

  const allPermissions = await permissionRepository.find();

  for (const roleData of roles) {
    let role = await roleRepository.findOne({ 
      where: { name: roleData.name },
      relations: ['permissions'] 
    });

    if (!role) {
      role = roleRepository.create({
        ...roleData,
        permissions: allPermissions
      });
      await roleRepository.save(role);
      console.log(`✓ Created role: ${roleData.name} with ${allPermissions.length} permissions`);
    } else {
      role.permissions = allPermissions;
      await roleRepository.save(role);
      console.log(`✓ Updated role: ${roleData.name} with ${allPermissions.length} permissions`);
    }
  }

  console.log('✓ Roles seeded (Super Administrator only)');
};
