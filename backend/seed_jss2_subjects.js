const { Client } = require('pg');
require('dotenv').config();

async function seed() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    // 1. Find JSS2 Class
    const classRes = await client.query("SELECT id, \"tenantId\" FROM classes WHERE name ILIKE '%JSS 2%' LIMIT 1");
    if (classRes.rows.length === 0) {
      console.error('Error: JSS 2 class not found.');
      return;
    }
    const jss2Id = classRes.rows[0].id;
    const tenantId = classRes.rows[0].tenantId;
    console.log(`Found JSS 2 class: ${jss2Id} (Tenant: ${tenantId})`);

    // 2. Find Current Session
    const sessionRes = await client.query("SELECT id FROM academic_sessions WHERE \"isActive\" = true LIMIT 1");
    const sessionId = sessionRes.rows.length > 0 ? sessionRes.rows[0].id : null;
    console.log(`Active Session: ${sessionId}`);

    // 3. Ensure a Subject Group exists (General)
    let groupRes = await client.query("SELECT id FROM subject_groups WHERE name = 'General' AND \"tenantId\" = $1 LIMIT 1", [tenantId]);
    let groupId;
    if (groupRes.rows.length === 0) {
      const newGroup = await client.query(
        "INSERT INTO subject_groups (id, name, \"tenantId\", \"createdAt\", \"updatedAt\") VALUES (gen_random_uuid(), 'General', $1, NOW(), NOW()) RETURNING id",
        [tenantId]
      );
      groupId = newGroup.rows[0].id;
      console.log(`Created 'General' Subject Group: ${groupId}`);
    } else {
      groupId = groupRes.rows[0].id;
      console.log(`Using existing 'General' Subject Group: ${groupId}`);
    }

    // 4. List of subjects to add
    const subjects = [
      'Mathematics',
      'English Language',
      'Basic Science',
      'Basic Technology',
      'Social Studies',
      'Civic Education',
      'ICT / Computer Studies',
      'Physical and Health Education',
      'Agricultural Science',
      'Business Studies',
      'Home Economics',
      'French',
      'Creative Arts',
      'Religious Studies'
    ];

    for (const subName of subjects) {
      // Find or Create Subject
      let subId;
      const subLookup = await client.query("SELECT id FROM subjects WHERE name = $1 AND \"tenantId\" = $2 LIMIT 1", [subName, tenantId]);
      
      if (subLookup.rows.length === 0) {
        const newSub = await client.query(
          "INSERT INTO subjects (id, name, \"groupId\", \"tenantId\", \"isCore\", \"isActive\", \"createdAt\", \"updatedAt\") VALUES (gen_random_uuid(), $1, $2, $3, true, true, NOW(), NOW()) RETURNING id",
          [subName, groupId, tenantId]
        );
        subId = newSub.rows[0].id;
        console.log(`Created Subject: ${subName} (${subId})`);
      } else {
        subId = subLookup.rows[0].id;
        console.log(`Subject exists: ${subName} (${subId})`);
      }

      // Assign to JSS2 Class (class_subject table)
      const linkLookup = await client.query(
        "SELECT id FROM class_subject WHERE class_id = $1 AND subject_id = $2 AND tenant_id = $3",
        [jss2Id, subId, tenantId]
      );

      if (linkLookup.rows.length === 0) {
        await client.query(
          "INSERT INTO class_subject (id, class_id, subject_id, tenant_id, session_id, is_core, is_active, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, true, true, NOW(), NOW())",
          [jss2Id, subId, tenantId, sessionId]
        );
        console.log(`  Assigned ${subName} to JSS2.`);
      } else {
        console.log(`  ${subName} already assigned to JSS2.`);
      }
    }

    console.log('--- Success: Subjects seeded and assigned to JSS2 ---');

  } catch (err) {
    console.error('Error seeding subjects:', err.message);
  } finally {
    await client.end();
  }
}

seed();
