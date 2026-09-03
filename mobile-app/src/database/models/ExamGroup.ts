import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text } from '@nozbe/watermelondb/decorators';

export default class ExamGroup extends Model {
  static table = 'exam_groups';

  @text('tenant_id') tenantId?: string;
  @text('name') name!: string;
  @text('description') description?: string;
  @text('start_date') startDate!: string;
  @text('end_date') endDate!: string;
  @text('academic_year') academicYear?: string;
  @text('term') term?: string;
  @field('is_active') isActive!: boolean;
  @field('is_published') isPublished!: boolean;
  @text('session_id') sessionId?: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
