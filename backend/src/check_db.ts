import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

async function check() {
  try {
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      synchronize: false,
      logging: false,
      entities: [join(__dirname, 'modules/finance/entities/*.entity.ts')],
    });

    console.log('--- Database Connection Successful ---');

    const tables = ['fee_heads', 'fee_groups', 'fee_assignments'];
    for (const table of tables) {
      const result = await connection.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${table}')`);
      console.log(`Table ${table} exists: ${result[0].exists}`);
      
      if (result[0].exists) {
        const columns = await connection.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table}'`);
        console.log(`Columns for ${table}:`, columns.map((c: any) => `${c.column_name} (${c.data_type})`).join(', '));
      }
    }

    await connection.close();
  } catch (err) {
    console.error('Check failed:', err);
  }
}

check();
