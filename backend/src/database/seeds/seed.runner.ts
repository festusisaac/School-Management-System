import { DataSource } from 'typeorm';
import { SeedDatabase } from './database.seed';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'sms_user',
  password: process.env.DATABASE_PASSWORD || 'your_secure_password',
  database: process.env.DATABASE_NAME || 'sms_db',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
  logging: false,
});

async function runSeed() {
  try {
    await dataSource.initialize();
    console.log('✓ Database connection established');

    const seeder = new SeedDatabase();
    await seeder.run(dataSource);

    await dataSource.destroy();
    console.log('✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed database:', error);
    process.exit(1);
  }
}

runSeed();
