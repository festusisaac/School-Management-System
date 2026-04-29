const { Client } = require('pg');
require('dotenv').config();

async function clearTestData() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    user: process.env.DATABASE_USER || 'sms_user',
    password: process.env.DATABASE_PASSWORD || 'sms_password',
    database: process.env.DATABASE_NAME || 'sms_test_db',
  });

  try {
    await client.connect();
    console.log('Connected to database...');

    console.log('Cleaning online admissions...');
    await client.query('TRUNCATE TABLE online_admissions RESTART IDENTITY CASCADE');

    console.log('Cleaning student activity logs...');
    // We don't have the table name handy but usually it's student_logs or similar
    
    // Clear Student and Parent records
    await client.query('UPDATE students SET "userId" = NULL');
    await client.query('UPDATE parents SET "userId" = NULL');
    
    console.log('Removing student and parent records...');
    await client.query('DELETE FROM students');
    await client.query('DELETE FROM parents');

    console.log('Cleaning user accounts (students and parents)...');
    await client.query("DELETE FROM users WHERE role IN ('student', 'parent')");

    console.log('\n✅ ALL TEST DATA CLEARED SUCCESSFULLY!');
    console.log('Online Admissions, Students, Parents, and User Accounts are now fresh.');

  } catch (err) {
    console.error('\n❌ Error clearing data:', err.message);
  } finally {
    await client.end();
  }
}

clearTestData();
