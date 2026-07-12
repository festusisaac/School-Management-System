const { DataSource } = require('typeorm');
const ds = new DataSource({ type: 'postgres', url: 'postgresql://sms_user:sms_password@localhost:5432/sms_test_db', synchronize: false });
ds.initialize().then(async () => {
  await ds.query(`DELETE FROM transactions WHERE "studentId" = '3353ca37-f68a-4977-a356-820eeae1ee68'`);
  // Also touch the fee assignments so the mobile app syncs fresh state
  await ds.query('UPDATE fee_assignments SET "updatedAt" = NOW()');
  console.log('Festus transactions cleared and fee assignments touched.');
  ds.destroy();
}).catch(console.error);
