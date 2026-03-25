import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Loan } from './loan.entity';

@Entity('fines')
export class Fine {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  loanId!: string;

  @ManyToOne(() => Loan)
  @JoinColumn({ name: 'loanId' })
  loan?: Loan;

  @Column({ type: 'numeric', default: 0 })
  amount!: number;

  @Column({ default: false })
  paid!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  paidAt?: Date;

  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
