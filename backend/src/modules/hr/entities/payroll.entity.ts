import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Staff } from './staff.entity';
import { SchoolSection } from '../../academics/entities/school-section.entity';

export enum PayrollStatus {
    PENDING = 'Pending',
    PROCESSED = 'Processed',
    PAID = 'Paid',
    CANCELLED = 'Cancelled'
}

export enum PaymentMethod {
    BANK_TRANSFER = 'Bank Transfer',
    CASH = 'Cash',
    CHEQUE = 'Cheque'
}

@Entity('payroll')
export class Payroll {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'staff_id' })
    staffId!: string;

    @Column({ type: 'int' })
    month!: number; // 1-12

    @Column({ type: 'int' })
    year!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'basic_salary' })
    basicSalary!: number;

    // Allowances (stored as JSON)
    @Column({ type: 'json', nullable: true })
    allowances!: {
        name: string;
        amount: number;
    }[];

    // Deductions (stored as JSON)
    @Column({ type: 'json', nullable: true })
    deductions!: {
        name: string;
        amount: number;
    }[];

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'gross_salary' })
    grossSalary!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'net_salary' })
    netSalary!: number;

    @Column({ type: 'int', name: 'working_days' })
    workingDays!: number;

    @Column({ type: 'int', name: 'present_days' })
    presentDays!: number;

    @Column({ type: 'int', name: 'absent_days', default: 0 })
    absentDays!: number;

    @Column({ type: 'int', name: 'leave_days', default: 0 })
    leaveDays!: number;

    @Column({ type: 'date', name: 'payment_date', nullable: true })
    paymentDate!: Date;

    @Column({ type: 'enum', enum: PaymentMethod, name: 'payment_method', nullable: true })
    paymentMethod!: PaymentMethod;

    @Column({ type: 'enum', enum: PayrollStatus, default: PayrollStatus.PENDING })
    status!: PayrollStatus;

    @Column({ type: 'text', nullable: true })
    remarks!: string;

    @Column({ name: 'processed_by', nullable: true })
    processedBy!: string;

    @ManyToOne(() => Staff, staff => staff.payrollRecords)
    @JoinColumn({ name: 'staff_id' })
    staff!: Staff;

    @Column({ type: 'uuid', nullable: true, name: 'school_section_id' })
    schoolSectionId?: string;

    @ManyToOne(() => SchoolSection)
    @JoinColumn({ name: 'school_section_id' })
    schoolSection?: SchoolSection;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
