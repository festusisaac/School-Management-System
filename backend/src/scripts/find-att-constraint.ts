import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'sms_user',
  password: process.env.DATABASE_PASSWORD || 'sms_password',
  database: process.env.DATABASE_NAME || 'sms_db'
});

async function findConstraint() {
  await ds.initialize();
  const res = await ds.query(`
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'student_attendance'::regclass 
    AND contype = 'u'
  `);
  console.table(res);
  process.exit(0);
}

findConstraint();
