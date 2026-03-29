import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

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

  @Index()
  @Column({ nullable: true })
  tenantId?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
