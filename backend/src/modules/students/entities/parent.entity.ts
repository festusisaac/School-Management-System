import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index, OneToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('parents')
export class Parent {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ nullable: true })
    fatherName?: string;

    @Column({ nullable: true })
    fatherPhone?: string;

    @Column({ nullable: true })
    fatherEmail?: string;

    @Column({ nullable: true })
    fatherOccupation?: string;

    @Column({ nullable: true })
    motherName?: string;

    @Column({ nullable: true })
    motherPhone?: string;

    @Column({ nullable: true })
    motherEmail?: string;

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

    @Column({ nullable: true, type: 'text' })
    permanentAddress?: string;

    @Column({ nullable: true })
    emergencyContact?: string;

    @Column({ type: 'uuid', nullable: true })
    userId?: string;

    @OneToOne(() => User, (user) => user.parent)
    @JoinColumn({ name: 'userId' })
    user?: User;

    @OneToMany(() => Student, (student) => student.parent)
    students?: Student[];

    @Index()
    @Column({ nullable: false })
    tenantId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
