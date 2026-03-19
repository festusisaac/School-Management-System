import { DataSource } from 'typeorm';
import { User } from '../modules/auth/entities/user.entity';
import { Role } from '../modules/auth/entities/role.entity';
import { Permission } from '../modules/auth/entities/permission.entity';
import * as dotenv from 'dotenv';

dotenv.config();

async function check() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'sms_db',
    entities: [User, Role, Permission],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connected!');

    const userRepo = dataSource.getRepository(User);
    const roleRepo = dataSource.getRepository(Role);

    const users = await userRepo.find({ relations: ['roleObject'] });
    console.log(`Total users: ${users.length}`);

    users.forEach(u => {
      console.log(`User: ${u.email}, Role String: ${u.role}, Role Object: ${u.roleObject?.name || 'NULL'}, Role ID: ${u.roleId}, Tenant ID: ${u.tenantId}`);
    });

    const roles = await roleRepo.find();
    console.log(`Total roles: ${roles.length}`);
    roles.forEach(r => {
        console.log(`Role: ${r.name}, ID: ${r.id}, isSystem: ${r.isSystem}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

check();
