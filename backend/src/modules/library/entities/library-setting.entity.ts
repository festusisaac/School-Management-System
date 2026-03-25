import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('library_settings')
export class LibrarySetting {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'int', default: 3 })
  graceDays!: number;

  @Column({ type: 'numeric', default: 50 })
  finePerDay!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
