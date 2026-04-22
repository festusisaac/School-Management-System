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
import { AcademicSession } from '@modules/system/entities/academic-session.entity';
import { SchoolSection } from '@modules/academics/entities/school-section.entity';
import { User } from '@modules/auth/entities/user.entity';
import { ExpenseCategory } from './expense-category.entity';
import { ExpenseVendor } from './expense-vendor.entity';

export enum ExpenseStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  REJECTED = 'REJECTED',
}

export enum ExpensePaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  POS = 'POS',
  CHEQUE = 'CHEQUE',
  ONLINE = 'ONLINE',
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: string;

  @Column({ type: 'date' })
  expenseDate!: string;

  @Column({ type: 'enum', enum: ExpenseStatus, default: ExpenseStatus.PENDING })
  status!: ExpenseStatus;

  @Column({ type: 'enum', enum: ExpensePaymentMethod, nullable: true })
  paymentMethod?: ExpensePaymentMethod | null;

  @Index()
  @Column({ type: 'uuid' })
  categoryId!: string;

  @ManyToOne(() => ExpenseCategory)
  @JoinColumn({ name: 'categoryId' })
  category!: ExpenseCategory;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  vendorId?: string | null;

  @ManyToOne(() => ExpenseVendor)
  @JoinColumn({ name: 'vendorId' })
  vendor?: ExpenseVendor | null;

  @Column({ type: 'varchar', nullable: true })
  referenceNumber?: string | null;

  @Column({ type: 'varchar', nullable: true })
  receiptUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  sessionId?: string | null;

  @ManyToOne(() => AcademicSession)
  @JoinColumn({ name: 'sessionId' })
  session?: AcademicSession | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  schoolSectionId?: string | null;

  @ManyToOne(() => SchoolSection)
  @JoinColumn({ name: 'schoolSectionId' })
  schoolSection?: SchoolSection | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  approvedById?: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approvedById' })
  approvedBy?: User | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  recordedById?: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recordedById' })
  recordedBy?: User | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Index()
  @Column({ type: 'varchar' })
  tenantId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
