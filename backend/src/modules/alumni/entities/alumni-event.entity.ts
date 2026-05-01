import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('alumni_events')
export class AlumniEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'timestamp' })
  eventDate!: Date;

  @Column({ nullable: true })
  location?: string;

  @Column({ default: 'upcoming' })
  status!: string; // upcoming, past, cancelled

  @Column({ nullable: true })
  bannerImage?: string;

  @Column({ type: 'int', nullable: true })
  targetGraduationYear?: number;

  @Index()
  @Column()
  tenantId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
