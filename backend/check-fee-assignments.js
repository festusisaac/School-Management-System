const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'sms_user',
  password: 'sms_password',
  database: 'sms_test_db',
});

const STUDENT_ID = '3353ca37-f68a-4977-a356-820eeae1ee68';

async function run() {
  await client.connect();

  // First discover the actual column names
  const cols = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'fee_heads'
    ORDER BY ordinal_position
  `);
  console.log('\n=== fee_heads columns ===');
  console.log(cols.rows.map(r => r.column_name));

  const assignmentCols = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'fee_assignments'
    ORDER BY ordinal_position
  `);
  console.log('\n=== fee_assignments columns ===');
  console.log(assignmentCols.rows.map(r => r.column_name));

  console.log('\n=== FEE ASSIGNMENTS for student ===');
  const assignments = await client.query(`
    SELECT * FROM fee_assignments WHERE "studentId" = $1 ORDER BY "updatedAt" DESC
  `, [STUDENT_ID]);
  console.log(JSON.stringify(assignments.rows, null, 2));

  if (assignments.rows.length === 0) {
    console.log('No assignments!');
    await client.end();
    return;
  }

  const feeGroupIds = assignments.rows.map(r => r.feeGroupId);

  console.log('\n=== FEE HEADS (using correct join) ===');
  const heads = await client.query(`
    SELECT fh.* FROM fee_heads fh
    INNER JOIN fee_assignments fa ON fa."feeGroupId" = fh."feeGroupId"
    WHERE fa."studentId" = $1
    ORDER BY fh."updatedAt" DESC
  `, [STUDENT_ID]);
  console.log(JSON.stringify(heads.rows, null, 2));

  console.log('\n=== TRANSACTIONS for student ===');
  const txns = await client.query(`
    SELECT id, type, amount, "updatedAt", meta
    FROM transactions
    WHERE "studentId" = $1
    ORDER BY "updatedAt" DESC
  `, [STUDENT_ID]);
  console.log(JSON.stringify(txns.rows, null, 2));

  // Simulate what sync would find for recent lastPulledAt
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  console.log(`\n=== Sync simulation (lastPulledAt=${sixHoursAgo}) ===`);
  const syncSim = await client.query(`
    SELECT DISTINCT fa.id, fa."studentId",
           fa."updatedAt" as fa_updated,
           fg."updatedAt" as fg_updated,
           fh.id as fh_id, fh.name as fh_name, fh."updatedAt" as fh_updated
    FROM fee_assignments fa
    LEFT JOIN fee_groups fg ON fg.id = fa."feeGroupId"
    LEFT JOIN fee_heads fh ON fh."feeGroupId" = fg.id
    WHERE fa."tenantId" = (SELECT "tenantId" FROM fee_assignments WHERE "studentId" = $1 LIMIT 1)
    AND (fa."updatedAt" > $2 OR fg."updatedAt" > $2 OR fh."updatedAt" > $2)
  `, [STUDENT_ID, sixHoursAgo]);
  console.log(`Assignments found by sync: ${syncSim.rows.length}`);
  console.log(JSON.stringify(syncSim.rows, null, 2));

  await client.end();
}

run().catch(console.error);
