import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('expense_vendors')
@Index(['tenantId', 'name'], { unique: true })
export class ExpenseVendor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  contactPerson?: string | null;

  @Column({ type: 'varchar', nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone?: string | null;

  @Column({ type: 'text', nullable: true })
  address?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Index()
  @Column({ type: 'varchar' })
  tenantId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
