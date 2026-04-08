import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cms_programs')
export class CmsProgram {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column()
  imageUrl!: string;

  @Column()
  level!: string;
}
