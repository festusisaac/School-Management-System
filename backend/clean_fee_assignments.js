/**
 * clean_fee_assignments.js
 * 
 * DANGER: This script PERMANENTLY DELETES all fee_assignments for the
 * currently active academic session (where isActive = true on academic_sessions).
 * 
 * It performs a DRY RUN first — you must confirm before deletion executes.
 * 
 * Usage:
 *   node clean_fee_assignments.js          -> dry run (safe, no changes)
 *   node clean_fee_assignments.js --commit -> actually deletes records
 */

const { Client } = require('pg');
require('dotenv').config();

const COMMIT = process.argv.includes('--commit');

async function run() {
    const client = new Client({
        user:     process.env.DATABASE_USER     || 'sms_user',
        host:     process.env.DATABASE_HOST     || 'localhost',
        database: process.env.DATABASE_NAME     || 'sms_db',
        password: process.env.DATABASE_PASSWORD || 'your_secure_password',
        port:     parseInt(process.env.DATABASE_PORT || '5432'),
    });

    try {
        await client.connect();
        console.log('✅ Connected to database.\n');

        // ── 1. Identify the active session ──────────────────────────────────
        const sessionRes = await client.query(
            `SELECT id, name FROM academic_sessions WHERE "isActive" = true LIMIT 1`
        );

        if (sessionRes.rows.length === 0) {
            console.error('❌  No active academic session found. Aborting.');
            process.exit(1);
        }

        const session = sessionRes.rows[0];
        console.log(`📅  Active Session : ${session.name}`);
        console.log(`🆔  Session ID     : ${session.id}\n`);

        // ── 2. Preview what will be deleted ─────────────────────────────────
        const previewRes = await client.query(
            `SELECT
                fa.id,
                s."firstName" || ' ' || s."lastName" AS student,
                s."admissionNo",
                fg.name AS "feeGroup",
                fa."isActive",
                fa."createdAt"
             FROM fee_assignments fa
             JOIN students   s  ON s.id  = fa."studentId"
             JOIN fee_groups fg ON fg.id = fa."feeGroupId"
             WHERE fa."sessionId" = $1
             ORDER BY s."firstName"`,
            [session.id]
        );

        console.log(`🔍  Records that will be affected: ${previewRes.rows.length}`);
        if (previewRes.rows.length > 0) {
            console.table(
                previewRes.rows.map(r => ({
                    'Student':      r.student,
                    'Adm. No':      r.admissionNo,
                    'Fee Group':    r.feeGroup,
                    'Active':       r.isActive,
                    'Assigned On':  new Date(r.createdAt).toLocaleDateString('en-NG'),
                }))
            );
        } else {
            console.log('   ℹ️  Nothing to clean — no fee assignments found for this session.');
            process.exit(0);
        }

        // ── 3. Guard ─────────────────────────────────────────────────────────
        if (!COMMIT) {
            console.log('\n⚠️  DRY RUN — no changes were made.');
            console.log('    To actually delete, run:\n');
            console.log('       node clean_fee_assignments.js --commit\n');
            process.exit(0);
        }

        // ── 4. Delete ────────────────────────────────────────────────────────
        console.log('\n🔴  --commit flag detected. Deleting records...\n');

        const deleteRes = await client.query(
            `DELETE FROM fee_assignments WHERE "sessionId" = $1`,
            [session.id]
        );

        console.log(`✅  Deleted ${deleteRes.rowCount} fee assignment(s) for session "${session.name}".`);
        console.log('\n   All done. Students no longer have any fee groups assigned for this session.');
        console.log('   You may now re-assign fee groups as needed.\n');

    } catch (err) {
        console.error('❌  Error:', err.message || err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
