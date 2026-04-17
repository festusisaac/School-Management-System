import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  tenantId!: string;

  @Column({ type: 'varchar' })
  userEmail!: string;

  @Column({ type: 'varchar' })
  action!: string; // e.g., 'SYSTEM_INITIALIZATION', 'USER_CREATED'

  @Column({ type: 'varchar', nullable: true })
  label!: string; // e.g., 'Fee Payment Recorded'

  @Column({ type: 'varchar', nullable: true })
  method!: string;

  @Column({ type: 'varchar', nullable: true })
  path!: string;

  @Column({ type: 'integer', nullable: true })
  statusCode!: number;

  @Column({ type: 'varchar', nullable: true })
  portal!: string; // e.g., 'ADMIN', 'STUDENT', 'STAFF', 'PARENT'

  @Column({ type: 'text', nullable: true })
  details!: string;

  @Column({ type: 'varchar', nullable: true })
  ipAddress!: string;

  @Column({ type: 'text', nullable: true })
  userAgent!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
