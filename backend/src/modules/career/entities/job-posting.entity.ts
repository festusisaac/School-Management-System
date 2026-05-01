import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum JobType {
  FULL_TIME = 'Full-time',
  PART_TIME = 'Part-time',
  INTERNSHIP = 'Internship',
  CONTRACT = 'Contract',
  FREELANCE = 'Freelance'
}

export enum JobStatus {
  OPEN = 'Open',
  CLOSED = 'Closed',
  FILLED = 'Filled'
}

@Entity('job_postings')
export class JobPosting {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column()
  company!: string;

  @Column({ nullable: true })
  location?: string;

  @Column({
    type: 'enum',
    enum: JobType,
    default: JobType.FULL_TIME
  })
  type!: JobType;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text', nullable: true })
  requirements?: string;

  @Column({ nullable: true })
  salaryRange?: string;

  @Column({ nullable: true })
  applicationUrl?: string;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.OPEN
  })
  status!: JobStatus;

  @Index()
  @Column()
  tenantId!: string;

  @CreateDateColumn()
  postedDate!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
