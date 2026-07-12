const { DataSource } = require('typeorm');
const ds = new DataSource({ type: 'postgres', url: 'postgresql://sms_user:sms_password@localhost:5432/sms_test_db', synchronize: false });
ds.initialize().then(async () => {
  await ds.query('UPDATE fee_assignments SET "updatedAt" = NOW()');
  console.log('Fee assignments touched');
  ds.destroy();
}).catch(console.error);
