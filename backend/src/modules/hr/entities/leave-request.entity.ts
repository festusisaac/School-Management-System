import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Staff } from './staff.entity';
import { LeaveType } from './leave-type.entity';
import { LeaveApproval } from './leave-approval.entity';

export enum LeaveStatus {
    PENDING = 'Pending',
    APPROVED = 'Approved',
    REJECTED = 'Rejected',
    CANCELLED = 'Cancelled'
}

@Entity('leave_requests')
export class LeaveRequest {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'staff_id' })
    staffId!: string;

    @Column({ name: 'leave_type_id' })
    leaveTypeId!: string;

    @Column({ type: 'date', name: 'start_date' })
    startDate!: Date;

    @Column({ type: 'date', name: 'end_date' })
    endDate!: Date;

    @Column({ type: 'int', name: 'number_of_days' })
    numberOfDays!: number;

    @Column({ type: 'text' })
    reason!: string;

    @Column({ type: 'enum', enum: LeaveStatus, default: LeaveStatus.PENDING })
    status!: LeaveStatus;

    @Column({ name: 'applied_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    appliedDate!: Date;

    @Column({ nullable: true, name: 'supporting_document' })
    supportingDocument!: string;

    @Column({ name: 'current_approval_level', default: 1 })
    currentApprovalLevel!: number;

    @Column({ name: 'total_approval_levels', default: 1 })
    totalApprovalLevels!: number;

    @Column({ name: 'final_approved_by', nullable: true })
    finalApprovedBy!: string;

    @Column({ name: 'final_approved_date', type: 'timestamp', nullable: true })
    finalApprovedDate!: Date;

    @Column({ name: 'rejection_reason', type: 'text', nullable: true })
    rejectionReason!: string;

    @ManyToOne(() => Staff, staff => staff.leaveRequests)
    @JoinColumn({ name: 'staff_id' })
    staff!: Staff;

    @ManyToOne(() => LeaveType, leaveType => leaveType.leaveRequests)
    @JoinColumn({ name: 'leave_type_id' })
    leaveType!: LeaveType;

    @OneToMany(() => LeaveApproval, approval => approval.leaveRequest)
    approvals!: LeaveApproval[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
