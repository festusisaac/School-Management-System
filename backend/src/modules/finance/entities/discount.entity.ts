import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'discounts' })
export class Discount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  percentage!: string;

  @Column({ type: 'varchar', nullable: true })
  studentId!: string | null;

  @Column({ default: true })
  active!: boolean;

  @Index()
  @Column({ nullable: true })
  tenantId?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
