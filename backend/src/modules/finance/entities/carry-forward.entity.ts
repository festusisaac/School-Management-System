import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { FeeHead } from './fee-head.entity';

@Entity({ name: 'carry_forwards' })
export class CarryForward {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  studentId!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: string;

  @Column()
  academicYear!: string;

  @Column({ nullable: true })
  sessionId?: string;

  @Column({ nullable: true })
  feeHeadId?: string;

  @ManyToOne(() => FeeHead)
  @JoinColumn({ name: 'feeHeadId' })
  feeHead?: FeeHead;

  @Column({ type: 'jsonb', nullable: true })
  meta?: any;

  @Index()
  @Column({ nullable: true })
  tenantId?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  createdAt!: Date;
}
