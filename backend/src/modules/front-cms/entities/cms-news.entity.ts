import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('cms_news')
export class CmsNews {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ unique: true })
  slug!: string;

  @Column()
  tag!: string;

  @Column()
  author!: string;

  @Column({ type: 'text' })
  snippet!: string;

  @Column({ type: 'text', nullable: true })
  content!: string;

  @Column({ nullable: true })
  imageUrl!: string;

  @CreateDateColumn()
  date!: Date;
}
