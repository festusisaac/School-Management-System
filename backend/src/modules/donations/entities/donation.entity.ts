import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne } from 'typeorm';
import { Alumni } from '../../alumni/entities/alumni.entity';

@Entity('donation_projects')
export class DonationProject {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  goalAmount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  currentAmount!: number;

  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date;

  @Column({ default: 'active' })
  status!: 'active' | 'completed' | 'cancelled';

  @Column({ nullable: true })
  bannerImage?: string;

  @Index()
  @Column()
  tenantId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('donations')
export class Donation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  alumniId?: string;

  @ManyToOne(() => Alumni, { nullable: true })
  alumni?: Alumni;

  @Column({ nullable: true })
  projectId?: string;

  @ManyToOne(() => DonationProject, { nullable: true })
  project?: DonationProject;

  @Column()
  donorName!: string;

  @Column()
  donorEmail!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ default: 'pending' })
  status!: 'pending' | 'success' | 'failed';

  @Column({ unique: true })
  paymentReference!: string;

  @Column({ nullable: true })
  paymentGateway?: string;

  @Column({ type: 'jsonb', nullable: true })
  paymentMetadata?: any;

  @Index()
  @Column()
  tenantId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
