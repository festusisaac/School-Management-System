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
  // __dirname resolves correctly in both contexts this file runs in:
  // - dev (ts-node on src/data-source.ts)  -> .../backend/src/database/migrations
  // - prod (node on dist/data-source.js)   -> .../backend/dist/database/migrations
  // The old process.cwd()-based path always pointed at src/, which doesn't exist in the
  // production image (the Dockerfile only ships dist/) — migrations silently found nothing.
  entities: [join(__dirname, '**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'database/migrations/*{.ts,.js}')],
  synchronize: process.env.DATABASE_SYNC === 'true',
  logging: process.env.DATABASE_LOGGING === 'true',
});

export default AppDataSource;
