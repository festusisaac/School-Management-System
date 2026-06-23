import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text } from '@nozbe/watermelondb/decorators';

export default class CommunicationLog extends Model {
  static table = 'communication_logs';

  @text('tenant_id') tenantId!: string;
  @text('type') type!: string;       // EMAIL | SMS
  @text('recipient') recipient!: string;
  @text('recipient_name') recipientName?: string;
  @text('subject') subject?: string;
  @text('body') body!: string;
  @text('status') status!: string;   // PENDING | SENT | DELIVERED | OPENED | FAILED
  @text('error_message') errorMessage?: string;
  @text('provider_message_id') providerMessageId?: string;

  @text('student_id') studentId?: string;
  @text('staff_id') staffId?: string;
  @text('parent_id') parentId?: string;

  @date('scheduled_at') scheduledAt?: Date;
  @date('delivered_at') deliveredAt?: Date;
  @date('opened_at') openedAt?: Date;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
