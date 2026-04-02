import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum CommunicationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export enum CommunicationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  OPENED = 'OPENED',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
  SCHEDULED = 'SCHEDULED',
}

@Entity('communication_logs')
export class CommunicationLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: CommunicationType })
  type!: CommunicationType;

  @Column()
  recipient!: string; // Email address or Phone number

  @Column({ nullable: true })
  recipientName?: string;

  @Column({ nullable: true })
  subject?: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'enum', enum: CommunicationStatus, default: CommunicationStatus.PENDING })
  status!: CommunicationStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ nullable: true })
  providerMessageId?: string; // Correlates with Resend/Termii IDs

  @Column({ type: 'uuid', nullable: true })
  studentId?: string;

  @Column({ type: 'uuid', nullable: true })
  staffId?: string;

  @Column({ type: 'uuid', nullable: true })
  parentId?: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  openedAt?: Date;

  @Index()
  @Column()
  tenantId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
