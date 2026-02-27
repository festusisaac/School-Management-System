import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'fee_structures' })
export class FeeStructure {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: string;

  @Column({ type: 'varchar', nullable: true })
  applicableToClass!: string | null; // class or category

  @CreateDateColumn()
  createdAt!: Date;
}
