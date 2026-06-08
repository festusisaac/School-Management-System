import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text } from '@nozbe/watermelondb/decorators';

export default class FeeRecord extends Model {
  static table = 'fee_records';

  @text('tenant_id') tenantId!: string;
  @text('student_id') studentId?: string;
  @field('amount') amount!: number;
  @text('type') type!: string;
  @text('payment_method') paymentMethod!: string;
  @text('reference') reference?: string;
  @text('fee_group_id') feeGroupId?: string;
  @text('session_id') sessionId?: string;
  @text('processed_by') processedBy?: string;
  @text('school_section_id') schoolSectionId?: string;
  @text('meta') meta?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
