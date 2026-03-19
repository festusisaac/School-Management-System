import { DataSource } from 'typeorm';
import { Role } from '../../modules/auth/entities/role.entity';

export const seedRoles = async (dataSource: DataSource) => {
  const roleRepository = dataSource.getRepository(Role);

  const roles = [
    { name: 'Super Administrator', description: 'Complete system access and management', isSystem: true },
  ];

  for (const roleData of roles) {
    const existingRole = await roleRepository.findOne({ where: { name: roleData.name } });
    if (!existingRole) {
      const role = roleRepository.create(roleData);
      await roleRepository.save(role);
    }
  }

  console.log('✓ Roles seeded (Super Administrator only)');
};
