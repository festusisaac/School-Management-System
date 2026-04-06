import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Class } from '../../academics/entities/class.entity';

@Entity('online_admissions')
export class OnlineAdmission {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    firstName!: string;

    @Column({ nullable: true })
    middleName?: string;

    @Column({ nullable: true })
    lastName?: string;

    @Index()
    @Column({ unique: true, nullable: true })
    referenceNumber?: string;

    @Column()
    gender!: string;

    @Column({ type: 'date' })
    dob!: Date;

    @Column({ nullable: true })
    religion?: string;

    @Column({ nullable: true })
    bloodGroup?: string;

    @Column({ nullable: true })
    genotype?: string;

    @Column({ nullable: true })
    stateOfOrigin?: string;

    @Column({ nullable: true })
    nationality?: string;

    @Column({ nullable: true })
    mobileNumber?: string;

    @Column({ nullable: true })
    email?: string;

    @Column()
    guardianName!: string;

    @Column()
    guardianPhone!: string;

    @Column()
    guardianRelation!: string;

    @Column({ nullable: true })
    fatherName?: string;

    @Column({ nullable: true })
    fatherPhone?: string;

    @Column({ nullable: true })
    fatherOccupation?: string;

    @Column({ nullable: true })
    motherName?: string;

    @Column({ nullable: true })
    motherPhone?: string;

    @Column({ nullable: true })
    motherOccupation?: string;

    @Column({ nullable: true })
    emergencyContact?: string;

    @Column({ type: 'text', nullable: true })
    permanentAddress?: string;

    @Column({ nullable: true })
    currentAddress?: string;

    @Column({ nullable: true })
    previousSchoolName?: string;

    @Column({ nullable: true })
    lastClassPassed?: string;

    @Column({ type: 'text', nullable: true })
    medicalConditions?: string;

    @Column({ nullable: true })
    preferredClassId?: string;

    @ManyToOne(() => Class, { nullable: true })
    @JoinColumn({ name: 'preferredClassId' })
    preferredClass?: any;

    // Document Paths
    @Column({ nullable: true })
    passportPhoto?: string;

    @Column({ nullable: true })
    birthCertificate?: string;

    // Payment Tracking
    @Column({ default: 'pending' })
    paymentStatus!: string; // 'pending', 'paid'

    @Index()
    @Column({ nullable: true })
    transactionReference?: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    amountPaid!: number;

    @Column({ default: 'pending' })
    status!: string; // 'pending', 'approved', 'rejected'

    @Column({ nullable: true })
    finalAdmissionNo?: string;

    @Column({ nullable: true })
    admittedStudentId?: string;

    @Index()
    @Column({ nullable: false })
    tenantId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
