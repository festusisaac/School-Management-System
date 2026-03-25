import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Student } from './student.entity';
import { Class } from '../../academics/entities/class.entity';
import { Section } from '../../academics/entities/section.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  MEDICAL = 'medical',
  HALFDAY = 'halfday',
  HOLIDAY = 'holiday'
}

@Entity('student_attendance')
@Index(['studentId', 'date', 'tenantId'], { unique: true })
export class StudentAttendance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  studentId!: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'studentId' })
  student?: Student;

  @Index()
  @Column()
  classId!: string;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'classId' })
  class?: Class;

  @Index()
  @Column({ nullable: true })
  sectionId?: string;

  @ManyToOne(() => Section)
  @JoinColumn({ name: 'sectionId' })
  section?: Section;

  @Index()
  @Column({ type: 'date' })
  date!: string; // Using string for date to avoid time zone issues with PostgreSQL date type

  @Column({
    type: 'varchar',
    length: 20,
    default: AttendanceStatus.PRESENT
  })
  status!: AttendanceStatus;

  @Column({ nullable: true, type: 'text' })
  remarks?: string;

  @Index()
  @Column()
  tenantId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
