import AppDataSource from '../data-source';

async function clearDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connection established.');

    const queryRunner = AppDataSource.createQueryRunner();
    
    // Get all tables in the public schema
    const tables = await queryRunner.query(`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT IN ('migrations')
    `);

    console.log(`🗑️ Found ${tables.length} tables to clear.`);

    // Disable triggers to avoid foreign key issues during truncate if needed, 
    // but CASCADE usually handles it. We'll use CASCADE for safety.
    for (const { tablename } of tables) {
      console.log(`  - Clearing ${tablename}...`);
      await queryRunner.query(`TRUNCATE TABLE "${tablename}" RESTART IDENTITY CASCADE;`);
    }

    console.log('✅ All tables cleared successfully!');
    
    await AppDataSource.destroy();
    console.log('👋 Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();
