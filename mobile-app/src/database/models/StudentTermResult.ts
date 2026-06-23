import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text, relation } from '@nozbe/watermelondb/decorators';
import type Student from './Student';
import type ExamGroup from './ExamGroup';

export default class StudentTermResult extends Model {
  static table = 'student_term_results';

  @text('tenant_id') tenantId?: string;
  @text('student_id') studentId?: string;
  @text('exam_group_id') examGroupId?: string;
  @text('class_id') classId?: string;
  @text('section_id') sectionId?: string;
  @text('session_id') sessionId?: string;

  @field('total_score') totalScore!: number;
  @field('average_score') averageScore!: number;
  @field('position') position?: number;
  @field('total_students') totalStudents?: number;

  @text('principal_comment') principalComment?: string;
  @text('teacher_comment') teacherComment?: string;

  @field('days_present') daysPresent!: number;
  @field('days_opened') daysOpened!: number;

  @text('status') status!: string; // DRAFT, PUBLISHED, WITHHELD

  @relation('students', 'student_id') student!: Student;
  @relation('exam_groups', 'exam_group_id') examGroup!: ExamGroup;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
