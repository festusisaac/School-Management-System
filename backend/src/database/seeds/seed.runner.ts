import { DataSource } from 'typeorm';
import { SeedDatabase } from './database.seed';
import AppDataSource from '../../data-source';

async function runSeed() {
  try {
    const dataSource = AppDataSource;
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
