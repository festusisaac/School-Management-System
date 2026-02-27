import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { LeaveRequest } from './leave-request.entity';
import { Staff } from './staff.entity';

export enum ApprovalAction {
    APPROVED = 'Approved',
    REJECTED = 'Rejected',
    PENDING = 'Pending'
}

@Entity('leave_approvals')
export class LeaveApproval {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'leave_request_id' })
    leaveRequestId!: string;

    @Column({ name: 'approver_id' })
    approverId!: string;

    @Column({ name: 'approval_level' })
    approvalLevel!: number; // 1 = Department Head, 2 = Principal, etc.

    @Column({ type: 'enum', enum: ApprovalAction, default: ApprovalAction.PENDING })
    action!: ApprovalAction;

    @Column({ type: 'text', nullable: true })
    comments!: string;

    @Column({ name: 'action_date', type: 'timestamp', nullable: true })
    actionDate!: Date;

    @ManyToOne(() => LeaveRequest, leaveRequest => leaveRequest.approvals)
    @JoinColumn({ name: 'leave_request_id' })
    leaveRequest!: LeaveRequest;

    @ManyToOne(() => Staff)
    @JoinColumn({ name: 'approver_id' })
    approver!: Staff;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}
