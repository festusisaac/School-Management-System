import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: '.env' });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'sms_user',
  password: process.env.DATABASE_PASSWORD || 'sms_password',
  database: process.env.DATABASE_NAME || 'sms_db',
  // When located in src, __dirname is the src folder
  entities: [join(__dirname, '**/*.entity{.ts,.js}')],
  migrations: [join(process.cwd(), 'src/database/migrations/*{.ts,.js}')],
  synchronize: process.env.DATABASE_SYNC === 'true',
  logging: process.env.DATABASE_LOGGING === 'true',
});

export default AppDataSource;
