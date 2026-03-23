import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum ReminderChannel {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  BOTH = 'BOTH',
}

export enum ReminderStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

@Entity({ name: 'payment_reminders' })
export class PaymentReminder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  studentId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount!: number | null;

  @Column({ type: 'timestamp' })
  dueDate!: Date;

  @Column({ type: 'text', nullable: true })
  message!: string | null;

  @Column({
    type: 'enum',
    enum: ReminderChannel,
    default: ReminderChannel.EMAIL,
  })
  channel!: ReminderChannel;

  @Column({
    type: 'enum',
    enum: ReminderStatus,
    default: ReminderStatus.PENDING,
  })
  status!: ReminderStatus;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @Column({ default: false })
  sent!: boolean;

  @Index()
  @Column({ nullable: true })
  tenantId?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
