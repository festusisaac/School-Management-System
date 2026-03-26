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
  const settingsRes = await c.query('SELECT * FROM library_settings');
  const settings = settingsRes.rows[0] || { graceDays: 3, finePerDay: 50 };
  console.log('Settings:', settings);
  
  const loansRes = await c.query("SELECT id, \"dueAt\", status FROM loans WHERE status='active'");
  console.log('Active Loans:', loansRes.rows.length);
  
  const now = new Date();
  for (const loan of loansRes.rows) {
    const dueAt = new Date(loan.dueAt);
    const msPerDay = 1000 * 60 * 60 * 24;
    const overdueMs = now.getTime() - dueAt.getTime();
    const overdueDays = Math.floor(overdueMs / msPerDay);
    const chargeable = Math.max(0, overdueDays - settings.graceDays);
    const fine = chargeable > 0 ? chargeable * parseInt(settings.finePerDay) : 0;
    
    console.log(JSON.stringify({
      id: loan.id,
      dueAt: dueAt.toISOString(),
      overdueDays,
      chargeable,
      fine
    }));
  }
  
  await c.end();
}

run().catch(console.error);
