import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  slug!: string; // e.g., 'students:view'

  @Column({ type: 'varchar' })
  name!: string; // e.g., 'View Students'

  @Column({ type: 'varchar', nullable: true })
  description!: string;

  @Column({ type: 'varchar' })
  module!: string; // e.g., 'Students', 'Finance'

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
