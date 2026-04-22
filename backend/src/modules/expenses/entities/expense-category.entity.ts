import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('expense_categories')
@Index(['tenantId', 'name'], { unique: true })
export class ExpenseCategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', nullable: true })
  code?: string | null;

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
