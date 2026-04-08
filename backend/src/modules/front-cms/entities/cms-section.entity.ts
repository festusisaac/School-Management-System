import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cms_sections')
export class CmsSection {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  key!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ nullable: true })
  imageUrl!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;
}
