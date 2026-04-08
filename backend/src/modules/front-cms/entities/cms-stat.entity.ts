import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cms_stats')
export class CmsStat {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  label!: string;

  @Column()
  value!: string;

  @Column({ default: 0 })
  order!: number;
}
