import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Class } from '../../academics/entities/class.entity';
import { Section } from '../../academics/entities/section.entity';
import { Subject } from '../../academics/entities/subject.entity';
import { AcademicSession } from '../../system/entities/academic-session.entity';
import { AcademicTerm } from '../../system/entities/academic-term.entity';
import { User } from '../../auth/entities/user.entity';

export enum DownloadResourceType {
  MATERIAL = 'material',
  SYLLABUS = 'syllabus',
  VIDEO = 'video',
  ACADEMIC_PROGRAM = 'academic_program',
  OTHER = 'other',
}

export enum DownloadResourceStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum DownloadResourceVisibility {
  ALL = 'all',               // Students + Parents + Staff
  STUDENTS = 'students',
  PARENTS = 'parents',
  STAFF = 'staff',           // All staff roles
  TEACHERS = 'teachers',
  ACCOUNTANTS = 'accountants',
  LIBRARIANS = 'librarians',
  PUBLIC = 'public',
}

@Entity('download_resources')
export class DownloadResource {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Index()
  @Column({ type: 'varchar', default: DownloadResourceType.MATERIAL })
  resourceType!: DownloadResourceType;

  @Column({ type: 'varchar', nullable: true })
  category?: string;

  @Column({ type: 'varchar', nullable: true })
  fileUrl?: string;

  @Column({ type: 'varchar', nullable: true })
  externalUrl?: string;

  @Column({ type: 'varchar', nullable: true })
  provider?: string;

  @Column({ type: 'varchar', nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'varchar', nullable: true })
  mimeType?: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize?: number;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  classId?: string;

  @ManyToOne(() => Class, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'classId' })
  class?: Class;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  sectionId?: string;

  @ManyToOne(() => Section, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sectionId' })
  section?: Section;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  subjectId?: string;

  @ManyToOne(() => Subject, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subjectId' })
  subject?: Subject;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  sessionId?: string;

  @ManyToOne(() => AcademicSession, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sessionId' })
  session?: AcademicSession;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  termId?: string;

  @ManyToOne(() => AcademicTerm, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'termId' })
  term?: AcademicTerm;

  @Index()
  @Column({ type: 'varchar', default: DownloadResourceVisibility.STUDENTS })
  visibility!: DownloadResourceVisibility;

  @Index()
  @Column({ type: 'varchar', default: DownloadResourceStatus.DRAFT })
  status!: DownloadResourceStatus;

  @Column({ type: 'boolean', default: false })
  isFeatured!: boolean;

  @Column({ type: 'int', default: 0 })
  downloadCount!: number;

  @Column({ type: 'int', default: 0 })
  viewCount!: number;

  @Column({ type: 'uuid', nullable: true })
  uploadedById?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy?: User;

  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
