import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Staff } from './staff.entity';
import { AcademicSession } from '../../system/entities/academic-session.entity';

export enum AttendanceStatus {
    PRESENT = 'Present',
    ABSENT = 'Absent',
    LATE = 'Late',
    HALF_DAY = 'Half-Day',
    ON_LEAVE = 'On Leave'
}

export enum AttendanceSource {
    MANUAL = 'Manual',
    BIOMETRIC = 'Biometric',
    RFID = 'RFID',
    MOBILE_APP = 'Mobile App'
}

@Entity('staff_attendance')
export class StaffAttendance {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'staff_id' })
    staffId!: string;

    @Column({ type: 'date' })
    date!: Date;

    @Column({ type: 'time', name: 'check_in_time', nullable: true })
    checkInTime!: string;

    @Column({ type: 'time', name: 'check_out_time', nullable: true })
    checkOutTime!: string;

    @Column({ type: 'enum', enum: AttendanceStatus })
    status!: AttendanceStatus;

    @Column({ type: 'enum', enum: AttendanceSource, default: AttendanceSource.MANUAL })
    source!: AttendanceSource;

    @Column({ type: 'text', nullable: true })
    remarks!: string;

    @Column({ name: 'is_late', default: false })
    isLate!: boolean;

    @Column({ type: 'int', name: 'late_minutes', default: 0 })
    lateMinutes!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, name: 'working_hours', default: 0 })
    workingHours!: number;

    // For biometric integration
    @Column({ name: 'device_id', nullable: true })
    deviceId!: string;

    @ManyToOne(() => Staff, staff => staff.attendanceRecords)
    @JoinColumn({ name: 'staff_id' })
    staff!: Staff;

    @Column({ type: 'uuid', nullable: true, name: 'session_id' })
    sessionId?: string;

    @ManyToOne(() => AcademicSession)
    @JoinColumn({ name: 'session_id' })
    session?: AcademicSession;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
