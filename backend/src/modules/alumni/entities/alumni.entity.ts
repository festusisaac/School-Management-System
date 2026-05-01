import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne, Index } from 'typeorm';
import { Student } from '../../students/entities/student.entity';

@Entity('alumni')
export class Alumni {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ nullable: true })
  studentId?: string;

  @OneToOne(() => Student)
  @JoinColumn({ name: 'studentId' })
  student?: Student;

  @Column()
  graduationYear!: number;

  @Column({ nullable: true })
  currentOccupation?: string;

  @Column({ nullable: true })
  currentCompany?: string;

  @Column({ nullable: true })
  linkedInUrl?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  achievements?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ default: false })
  isMentorshipAvailable!: boolean;

  @Column({ type: 'text', nullable: true })
  adminNotes?: string;

  @Column({ default: false })
  isFeatured!: boolean;

  @Index()
  @Column()
  tenantId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
