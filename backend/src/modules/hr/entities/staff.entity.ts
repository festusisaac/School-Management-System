import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Department } from './department.entity';
import { Designation } from './designation.entity';
import { StaffAttendance } from './staff-attendance.entity';
import { LeaveRequest } from './leave-request.entity';
import { Payroll } from './payroll.entity';

export enum EmploymentType {
    FULL_TIME = 'Full-Time',
    PART_TIME = 'Part-Time',
    CONTRACT = 'Contract',
    TEMPORARY = 'Temporary'
}

export enum StaffStatus {
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
    ON_LEAVE = 'On Leave',
    SUSPENDED = 'Suspended',
    TERMINATED = 'Terminated'
}

export enum MaritalStatus {
    SINGLE = 'Single',
    MARRIED = 'Married',
    DIVORCED = 'Divorced',
    WIDOWED = 'Widowed'
}

export enum Gender {
    MALE = 'Male',
    FEMALE = 'Female',
    OTHER = 'Other'
}

@Entity('staff')
export class Staff {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // Personal Information
    @Column({ name: 'employee_id', unique: true })
    employeeId!: string;

    @Column({ name: 'first_name' })
    firstName!: string;

    @Column({ name: 'last_name' })
    lastName!: string;

    @Column({ type: 'date', name: 'date_of_birth', nullable: true })
    dateOfBirth!: Date;

    @Column({ type: 'enum', enum: Gender })
    gender!: Gender;

    @Column({ name: 'blood_group', nullable: true })
    bloodGroup!: string;

    @Column({ nullable: true })
    photo!: string;

    // Contact Information
    @Column({ unique: true })
    email!: string;

    @Column()
    phone!: string;

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

    @Column({ type: 'text', nullable: true })
    address!: string;

    @Column({ nullable: true })
    city!: string;

    @Column({ nullable: true })
    state!: string;

    @Column({ nullable: true })
    country!: string;

    @Column({ name: 'postal_code', nullable: true })
    postalCode!: string;

    // Emergency Contact
    @Column({ name: 'emergency_contact_name', nullable: true })
    emergencyContactName!: string;

    @Column({ name: 'emergency_contact_phone', nullable: true })
    emergencyContactPhone!: string;

    @Column({ name: 'emergency_contact_relation', nullable: true })
    emergencyContactRelation!: string;

    // Employment Information
    @Column({ type: 'date', name: 'date_of_joining' })
    dateOfJoining!: Date;

    @Column({ name: 'department_id' })
    departmentId!: string;

    @Column({ name: 'designation_id' })
    designationId!: string;

    @Column({ type: 'enum', enum: EmploymentType, name: 'employment_type' })
    employmentType!: EmploymentType;

    @Column({ type: 'enum', enum: StaffStatus, default: StaffStatus.ACTIVE })
    status!: StaffStatus;

    // Financial Information
    @Column({ name: 'bank_name', nullable: true })
    bankName!: string;

    @Column({ name: 'account_title', nullable: true })
    accountTitle!: string;

    @Column({ name: 'account_number', nullable: true })
    accountNumber!: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'basic_salary' })
    basicSalary!: number;

    // Documents
    @Column({ nullable: true })
    resume!: string;

    @Column({ type: 'json', nullable: true })
    certificates!: string[];

    @Column({ name: 'id_proof', nullable: true })
    idProof!: string;

    // Qualifications
    @Column({ type: 'text', nullable: true })
    qualifications!: string;

    // Biometric/Attendance Device ID
    @Column({ name: 'biometric_id', nullable: true, unique: true })
    biometricId!: string;

    // --- Extended Fields ---
    @Column({ nullable: true })
    role!: string;

    @Column({ name: 'father_name', nullable: true })
    fatherName!: string;

    @Column({ name: 'mother_name', nullable: true })
    motherName!: string;

    @Column({ type: 'enum', enum: MaritalStatus, nullable: true, name: 'marital_status' })
    maritalStatus!: MaritalStatus;

    @Column({ name: 'permanent_address', type: 'text', nullable: true })
    permanentAddress!: string;

    @Column({ name: 'work_experience', type: 'text', nullable: true })
    workExperience!: string;

    @Column({ type: 'text', nullable: true })
    note!: string;

    // Social Media
    @Column({ name: 'facebook_url', nullable: true })
    facebookUrl!: string;

    @Column({ name: 'twitter_url', nullable: true })
    twitterUrl!: string;

    @Column({ name: 'linkedin_url', nullable: true })
    linkedinUrl!: string;

    @Column({ name: 'instagram_url', nullable: true })
    instagramUrl!: string;

    // Documents - Extended
    @Column({ name: 'joining_letter', nullable: true })
    joiningLetter!: string;

    @Column({ name: 'resignation_letter', nullable: true })
    resignationLetter!: string;

    @Column({ name: 'other_documents', type: 'json', nullable: true })
    otherDocuments!: string[];

    @Column({ name: 'is_teaching_staff', default: false })
    isTeachingStaff!: boolean;

    // Relations
    @ManyToOne(() => Department, department => department.staff)
    @JoinColumn({ name: 'department_id' })
    department!: Department;

    @ManyToOne(() => Designation, designation => designation.staff)
    @JoinColumn({ name: 'designation_id' })
    designation!: Designation;

    @OneToMany(() => StaffAttendance, attendance => attendance.staff)
    attendanceRecords!: StaffAttendance[];

    @OneToMany(() => LeaveRequest, leave => leave.staff)
    leaveRequests!: LeaveRequest[];

    @OneToMany(() => Payroll, payroll => payroll.staff)
    payrollRecords!: Payroll[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
