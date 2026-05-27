import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Student extends Model {
  static table = 'students'

  @field('tenant_id') tenantId!: string
  @field('first_name') firstName!: string
  @field('last_name') lastName?: string
  @field('admission_no') admissionNo!: string
  @field('gender') gender!: string
  @field('class_id') classId?: string
  @field('is_active') isActive!: boolean

  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}
