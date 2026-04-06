import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Role } from './role.entity';
import { Student } from '../../students/entities/student.entity';
import { Parent } from '../../students/entities/parent.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar' })
  password!: string;

  @Column({ type: 'varchar' })
  firstName!: string;

  @Column({ type: 'varchar' })
  lastName!: string;

  @Column({
    type: 'varchar',
    nullable: true
  })
  role!: string;

  @Column({ type: 'uuid', nullable: true })
  roleId!: string;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'roleId' })
  roleObject!: Role;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  tenantId!: string;

  @Column({ type: 'varchar', nullable: true })
  photo?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  mustChangePassword!: boolean;

  @OneToOne(() => Student, (student) => student.user)
  student?: Student;

  @OneToOne(() => Parent, (parent) => parent.user)
  parent?: Parent;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
