import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { FeeGroup } from './fee-group.entity';

export enum TransactionType {
  FEE_PAYMENT = 'FEE_PAYMENT',
  REFUND = 'REFUND',
  ADJUSTMENT = 'ADJUSTMENT',
  WAIVER = 'WAIVER',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  POS = 'POS',
  ONLINE = 'ONLINE',
}

@Entity({ name: 'transactions' })
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: string;

  @Column({ type: 'enum', enum: TransactionType, default: TransactionType.FEE_PAYMENT })
  type!: TransactionType;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  studentId?: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'studentId' })
  student?: Student;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  feeGroupId?: string;

  @ManyToOne(() => FeeGroup)
  @JoinColumn({ name: 'feeGroupId' })
  feeGroup?: FeeGroup;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  tenantId?: string;

  @Column({ type: 'varchar', nullable: true })
  reference!: string | null;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.CASH })
  paymentMethod!: PaymentMethod;

  @Column({ type: 'varchar', nullable: true })
  processedBy!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  meta: any | null;

  @CreateDateColumn()
  createdAt!: Date;
}
