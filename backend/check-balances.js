const { DataSource } = require('typeorm');
const ds = new DataSource({ type: 'postgres', url: 'postgresql://sms_user:sms_password@localhost:5432/sms_test_db', synchronize: false });

ds.initialize().then(async () => {
  // Check discount profiles
  const profiles = await ds.query('SELECT * FROM discount_profiles');
  console.log('Discount Profiles:', JSON.stringify(profiles, null, 2));

  // Check discount rules
  const rules = await ds.query('SELECT * FROM discount_rules');
  console.log('\nDiscount Rules:', JSON.stringify(rules, null, 2));

  // Check students for discountProfileId
  const students = await ds.query('SELECT id, "firstName", "lastName", "discountProfileId" FROM students');
  console.log('\nStudents:', JSON.stringify(students, null, 2));

  // Check what the fee head amount REALLY is vs what sync sends
  const feeHeads = await ds.query('SELECT id, name, "defaultAmount" FROM fee_heads');
  console.log('\nFee Heads:', JSON.stringify(feeHeads, null, 2));

  // Calculate what the website calculates: due = head.defaultAmount (possibly discounted) - paid
  for (const s of students) {
    const txs = await ds.query('SELECT amount FROM transactions WHERE "studentId" = $1 AND type != \'CARRY_FORWARD\'', [s.id]);
    const totalPaid = txs.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    console.log(`\n${s.firstName} ${s.lastName}: totalPaid=${totalPaid}, feeHeadAmount=30000, outstanding=${Math.max(0, 30000 - totalPaid)}`);
  }

  ds.destroy();
}).catch(console.error);
