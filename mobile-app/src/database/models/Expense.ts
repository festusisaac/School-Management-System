import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text } from '@nozbe/watermelondb/decorators';

export default class Expense extends Model {
  static table = 'expenses';

  @text('tenant_id') tenantId!: string;
  @text('title') title!: string;
  @text('description') description?: string;
  @field('amount') amount!: number;
  @text('expense_date') expenseDate?: string;
  @text('status') status?: string;
  @text('payment_method') paymentMethod?: string;
  @text('category_id') categoryId?: string;
  @text('vendor_id') vendorId?: string;
  @text('category_name') categoryName?: string;
  @text('vendor_name') vendorName?: string;
  @text('reference_number') referenceNumber?: string;
  @text('session_id') sessionId?: string;
  @text('school_section_id') schoolSectionId?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
