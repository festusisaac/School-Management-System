import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text, relation } from '@nozbe/watermelondb/decorators';
import type Student from './Student';

export default class StudentDocument extends Model {
  static table = 'student_documents';

  @text('tenant_id') tenantId?: string;
  @text('student_id') studentId!: string;
  @text('title') title!: string;
  @text('file_path') filePath!: string;
  @text('file_type') fileType?: string;

  @relation('students', 'student_id') student!: Student;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
