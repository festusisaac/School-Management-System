const { DataSource } = require('typeorm');
const ds = new DataSource({
  type: 'postgres',
  url: 'postgresql://sms_user:sms_password@localhost:5432/sms_test_db'
});
ds.initialize().then(async () => {
  // Bump assignments too so they appear in incremental pull
  await ds.query('UPDATE fee_assignments SET "updatedAt" = NOW()');
  // Bump transactions
  await ds.query('UPDATE transactions SET "updatedAt" = NOW()');
  console.log('Updated timestamps on transactions and fee_assignments');
  process.exit(0);
}).catch(console.error);
