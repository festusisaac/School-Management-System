import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CmsCarouselImage } from './cms-carousel-image.entity';

@Entity('cms_heroes')
export class CmsHero {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ default: 'Nurturing Leaders of Tomorrow' })
  title!: string;

  @Column({ default: 'Welcome to our school, where we combine academic rigor with moral guidance.' })
  subtitle!: string;

  @Column({ default: 'Excellence in Education' })
  welcomeText!: string;

  @OneToMany(() => CmsCarouselImage, (image) => image.hero, { cascade: true })
  carouselImages!: CmsCarouselImage[];
}
