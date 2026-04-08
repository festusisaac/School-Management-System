import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { CmsHero } from './cms-hero.entity';

@Entity('cms_carousel_images')
export class CmsCarouselImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  imageUrl!: string;

  @Column({ default: 0 })
  order!: number;

  @ManyToOne(() => CmsHero, (hero) => hero.carouselImages)
  hero!: CmsHero;
}
