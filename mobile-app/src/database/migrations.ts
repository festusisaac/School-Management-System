import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations';

/**
 * WatermelonDB schema migrations.
 *
 * RULE: every time you bump `version` in schema.ts, add a matching migration
 * entry here with the same `toVersion`. Migrations upgrade the local database
 * IN PLACE — preserving data (including unsynced offline writes) instead of
 * wiping it. A version bump WITHOUT a matching migration falls back to a full
 * wipe + re-sync, which loses pending offline records, so never skip one.
 *
 * Only additive steps are supported: `createTable` and `addColumns`. To
 * "rename"/"retype" a column, add a new one, backfill, and stop using the old.
 *
 * The lowest `toVersion` here is the migration baseline: installs at or above
 * (baseline - 1) upgrade in place; anything older gets one final reset.
 * `example` below shows the shape of the NEXT migration you'd add.
 */
export default schemaMigrations({
  migrations: [
    // --- v8: offline accountant expenses ---
    {
      toVersion: 8,
      steps: [
        createTable({
          name: 'expenses',
          columns: [
            { name: 'tenant_id', type: 'string', isIndexed: true },
            { name: 'title', type: 'string' },
            { name: 'description', type: 'string', isOptional: true },
            { name: 'amount', type: 'number' },
            { name: 'expense_date', type: 'string', isOptional: true },
            { name: 'status', type: 'string', isOptional: true },
            { name: 'payment_method', type: 'string', isOptional: true },
            { name: 'category_id', type: 'string', isOptional: true },
            { name: 'vendor_id', type: 'string', isOptional: true },
            { name: 'category_name', type: 'string', isOptional: true },
            { name: 'vendor_name', type: 'string', isOptional: true },
            { name: 'reference_number', type: 'string', isOptional: true },
            { name: 'session_id', type: 'string', isOptional: true },
            { name: 'school_section_id', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
            { name: 'deleted_at', type: 'number', isOptional: true },
          ],
        }),
      ],
    },

    // --- v9: school section on classes (for admin section filtering) ---
    {
      toVersion: 9,
      steps: [
        addColumns({
          table: 'classes',
          columns: [{ name: 'school_section_id', type: 'string', isOptional: true }],
        }),
      ],
    },

    // --- TEMPLATE for the next change (copy, uncomment, adjust) ---
    // Remember to also bump `version` in schema.ts to the same number.
    // {
    //   toVersion: 10,
    //   steps: [
    //     addColumns({
    //       table: 'expenses',
    //       columns: [{ name: 'receipt_url', type: 'string', isOptional: true }],
    //     }),
    //   ],
    // },
  ],
});
