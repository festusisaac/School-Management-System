import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Student } from './student.entity';

@Entity('parents')
export class Parent {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

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

    @Column({ nullable: true, type: 'text' })
    guardianAddress?: string;

    @Column({ nullable: true })
    emergencyContact?: string;

    @OneToMany(() => Student, (student) => student.parent)
    students?: Student[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
