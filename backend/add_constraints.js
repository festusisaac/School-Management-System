const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

async function run() {
  const c = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'sms_db'
  });
  
  await c.connect();
  
  try {
      await c.query('ALTER TABLE staff ADD CONSTRAINT "UQ_staff_employeeId_tenantId" UNIQUE (employee_id, "tenantId")');
      console.log('Added UQ_staff_employeeId_tenantId');
  } catch (e) {
      console.log(e.message);
  }

  try {
      await c.query('ALTER TABLE staff ADD CONSTRAINT "UQ_staff_email_tenantId" UNIQUE (email, "tenantId")');
      console.log('Added UQ_staff_email_tenantId');
  } catch (e) {
      console.log(e.message);
  }

  try {
      await c.query('ALTER TABLE staff ADD CONSTRAINT "UQ_staff_biometricId_tenantId" UNIQUE (biometric_id, "tenantId")');
      console.log('Added UQ_staff_biometricId_tenantId');
  } catch (e) {
      console.log(e.message);
  }

  await c.end();
}

run().catch(console.error);
