import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cms_testimonials')
export class CmsTestimonial {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  author!: string;

  @Column()
  role!: string;

  @Column({ type: 'text' })
  quote!: string;

  @Column({ default: 5 })
  rating!: number;

  @Column({ default: true })
  isActive!: boolean;
}
