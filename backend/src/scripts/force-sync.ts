import AppDataSource from '../data-source';

async function run() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected.');

    const tables = ['students', 'classes', 'sections', 'transactions', 'student_attendances'];

    for (const table of tables) {
      console.log(`Updating timestamps for ${table}...`);
      await AppDataSource.query(`UPDATE ${table} SET "updatedAt" = NOW()`);
    }

    console.log('Successfully updated all timestamps! The mobile app will now sync these records.');
    process.exit(0);
  } catch (error) {
    console.error('Error updating timestamps:', error);
    process.exit(1);
  }
}

run();
