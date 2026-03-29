import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  userEmail!: string;

  @Column({ type: 'varchar' })
  action!: string; // e.g., 'SYSTEM_INITIALIZATION', 'USER_CREATED'

  @Column({ type: 'text', nullable: true })
  details!: string;

  @Column({ type: 'varchar', nullable: true })
  ipAddress!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
