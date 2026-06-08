import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'students',
      columns: [
        { name: 'tenant_id', type: 'string', isIndexed: true },
        { name: 'first_name', type: 'string' },
        { name: 'last_name', type: 'string', isOptional: true },
        { name: 'admission_no', type: 'string', isIndexed: true },
        { name: 'gender', type: 'string' },
        { name: 'class_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'tenant_id', type: 'string', isIndexed: true },
        { name: 'amount', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'student_id', type: 'string', isIndexed: true },
        { name: 'fee_group_id', type: 'string', isOptional: true },
        { name: 'reference', type: 'string', isOptional: true },
        { name: 'payment_method', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),
  ]
})
