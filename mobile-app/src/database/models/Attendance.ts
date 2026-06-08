import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text } from '@nozbe/watermelondb/decorators';

export default class Attendance extends Model {
  static table = 'attendance';

  @text('tenant_id') tenantId!: string;
  @text('student_id') studentId!: string;
  @text('class_id') classId!: string;
  @text('section_id') sectionId?: string;
  @text('date') date!: string;
  @text('status') status!: string;
  @text('remarks') remarks?: string;
  @text('session_id') sessionId?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
