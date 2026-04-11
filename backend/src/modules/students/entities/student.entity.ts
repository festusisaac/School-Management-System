import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index, OneToOne } from 'typeorm';
import { Class } from '../../academics/entities/class.entity';
import { Section } from '../../academics/entities/section.entity';
import { StudentCategory } from './student-category.entity';
import { StudentHouse } from './student-house.entity';
import { DeactivateReason } from './deactivate-reason.entity';
import { Parent } from './parent.entity';
import { StudentDocument } from './student-document.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToMany(() => StudentDocument, (doc) => doc.student)
  documents?: StudentDocument[];

  // ... (existing fields)

  // Parent Relationship
  @Index()
  @Column({ nullable: true })
  parentId?: string;

  @ManyToOne(() => Parent, (parent) => parent.students)
  @JoinColumn({ name: 'parentId' })
  parent?: Parent;


  @Column({ unique: true })
  admissionNo!: string;

  @Column({ nullable: true })
  rollNo?: string;

  // Personal Details
  @Column()
  firstName!: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  middleName?: string;

  @Column()
  gender!: string;

  @Column({ type: 'date' })
  dob!: Date;

  @Column({ nullable: true })
  religion?: string;

  @Column({ nullable: true })
  caste?: string;

  @Column({ nullable: true })
  mobileNumber?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  fatherEmail?: string;

  @Column({ nullable: true })
  motherEmail?: string;

  @Column({ type: 'date' })
  admissionDate!: Date;

  @Column({ nullable: true })
  studentPhoto?: string;

  @Column({ nullable: true })
  bloodGroup?: string;

  @Column({ nullable: true })
  genotype?: string;

  @Column({ nullable: true })
  stateOfOrigin?: string;

  @Column({ nullable: true })
  nationality?: string;

  @Column({ nullable: true })
  height?: string;

  @Column({ nullable: true })
  weight?: string;

  @Column({ type: 'date', nullable: true })
  asOnDate?: Date;

  // Academic Details
  @Index()
  @Column({ nullable: true })
  classId?: string;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'classId' })
  class?: Class;

  @Index()
  @Column({ nullable: true })
  sectionId?: string;

  @ManyToOne(() => Section)
  @JoinColumn({ name: 'sectionId' })
  section?: Section;

  @Column({ nullable: true })
  categoryId?: string;

  @ManyToOne(() => StudentCategory)
  @JoinColumn({ name: 'categoryId' })
  category?: StudentCategory;

  @Column({ nullable: true })
  houseId?: string;

  @ManyToOne(() => StudentHouse)
  @JoinColumn({ name: 'houseId' })
  house?: StudentHouse;

  @Column({ nullable: true })
  userId?: string;

  @OneToOne(() => User, (user) => user.student)
  @JoinColumn({ name: 'userId' })
  user?: User;

  // Parent/Guardian Details
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
  guardianName?: string;

  @Column({ nullable: true })
  guardianRelation?: string;

  @Column({ nullable: true })
  guardianPhone?: string;

  @Column({ nullable: true })
  guardianEmail?: string;

  @Column({ nullable: true })
  guardianPhoto?: string;

  @Column({ nullable: true, type: 'text' })
  guardianAddress?: string;

  @Column({ nullable: true })
  emergencyContact?: string;

  // Addresses
  @Column({ nullable: true, type: 'text' })
  currentAddress?: string;

  @Column({ nullable: true, type: 'text' })
  permanentAddress?: string;

  // Transport Details
  @Column({ nullable: true })
  transportRoute?: string;

  @Column({ nullable: true })
  vehicleNumber?: string;

  @Column({ nullable: true })
  pickupPoint?: string;

  // Hostel Details
  @Column({ nullable: true })
  hostelName?: string;

  @Column({ nullable: true })
  roomNumber?: string;

  @Column({ type: 'text', nullable: true })
  medicalConditions?: string;

  @Column({ nullable: true })
  previousSchoolName?: string;

  @Column({ nullable: true })
  lastClassPassed?: string;

  // Status
  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true, type: 'date' })
  deactivatedAt?: Date;

  @Column({ nullable: true })
  deactivateReasonId?: string;

  @ManyToOne(() => DeactivateReason)
  @JoinColumn({ name: 'deactivateReasonId' })
  deactivateReason?: DeactivateReason;

  @Column({ nullable: true })
  discountProfileId?: string;


    @Index()
    @Column({ nullable: false })
    tenantId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
