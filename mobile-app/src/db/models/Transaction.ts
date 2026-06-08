import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Transaction extends Model {
  static table = 'transactions'

  @field('tenant_id') tenantId!: string
  @field('amount') amount!: string
  @field('type') type!: string
  @field('student_id') studentId!: string
  @field('fee_group_id') feeGroupId?: string
  @field('reference') reference?: string
  @field('payment_method') paymentMethod!: string

  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}
