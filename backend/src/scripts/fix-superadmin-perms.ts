import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Role } from '../modules/auth/entities/role.entity';
import { Permission } from '../modules/auth/entities/permission.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const roleRepo = app.get<Repository<Role>>(getRepositoryToken(Role));
  const permRepo = app.get<Repository<Permission>>(getRepositoryToken(Permission));

  console.log('--- Super Administrator Permission Sync ---');

  // 1. Find Super Admin role
  const superAdminRole = await roleRepo.findOne({
    where: { name: 'Super Administrator' },
    relations: ['permissions']
  });

  if (!superAdminRole) {
    console.error('Super Administrator role not found!');
    await app.close();
    return;
  }

  // 2. Fetch all permissions
  const allPermissions = await permRepo.find();
  console.log(`Found ${allPermissions.length} total permissions in system.`);

  // 3. Sync permissions
  superAdminRole.permissions = allPermissions;
  await roleRepo.save(superAdminRole);

  console.log(`Successfully synced all ${allPermissions.length} permissions to Super Administrator.`);
  
  await app.close();
}

bootstrap();
