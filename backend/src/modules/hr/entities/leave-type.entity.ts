import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { LeaveRequest } from './leave-request.entity';

@Entity('leave_types')
export class LeaveType {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    name!: string;

    @Column({ unique: true })
    code!: string;

    @Column({ type: 'int', name: 'max_days_per_year' })
    maxDaysPerYear!: number;

    @Column({ name: 'is_paid', default: true })
    isPaid!: boolean;

    @Column({ name: 'requires_approval', default: true })
    requiresApproval!: boolean;

    @Column({ name: 'requires_document', default: false })
    requiresDocument!: boolean;

    @Column({ type: 'text', nullable: true })
    description!: string;

    @Column({ default: true })
    isActive!: boolean;

    @OneToMany(() => LeaveRequest, leave => leave.leaveType)
    leaveRequests!: LeaveRequest[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
