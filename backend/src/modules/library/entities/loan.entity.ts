import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BookCopy } from './book-copy.entity';

@Entity('loans')
export class Loan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  copyId!: string;

  @ManyToOne(() => BookCopy)
  @JoinColumn({ name: 'copyId' })
  copy?: BookCopy;

  @Column({ type: 'uuid', nullable: true })
  borrowerId?: string; // typically student.userId or student id

  @Column({ type: 'timestamp' })
  issuedAt!: Date;

  @Column({ type: 'timestamp' })
  dueAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  returnedAt?: Date;

  @Column({ default: 'active' })
  status!: string; // active | returned | overdue

  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
