import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BookCopy } from './book-copy.entity';
import { Student } from '../../students/entities/student.entity';
import { Staff } from '../../hr/entities/staff.entity';

@Entity('loans')
export class Loan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  copyId!: string;

  @ManyToOne(() => BookCopy)
  @JoinColumn({ name: 'copyId' })
  copy?: BookCopy;

  @Column({ type: 'uuid', nullable: true })
  studentId?: string;

  @ManyToOne(() => Student, { nullable: true })
  @JoinColumn({ name: 'studentId' })
  student?: Student;

  @Column({ type: 'uuid', nullable: true })
  staffId?: string;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'staffId' })
  staff?: Staff;

  @Column({ type: 'uuid', nullable: true })
  borrowerId?: string;

  @Column({ type: 'timestamp' })
  issuedAt!: Date;

  @Column({ type: 'timestamp' })
  dueAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  returnedAt?: Date;

  @Column({ default: 'active' })
  status!: string; // active | returned | overdue

  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
