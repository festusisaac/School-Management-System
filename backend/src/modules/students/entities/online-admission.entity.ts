import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('online_admissions')
export class OnlineAdmission {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    firstName!: string;

    @Column({ nullable: true })
    lastName?: string;

    @Column()
    gender!: string;

    @Column({ type: 'date' })
    dob!: Date;

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
    currentAddress?: string;

    @Column({ nullable: true })
    preferredClassId?: string;

    @Column({ default: 'pending' })
    status!: string;

    @Index()
    @Column({ nullable: false })
    tenantId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
