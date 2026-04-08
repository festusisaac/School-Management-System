import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cms_gallery_items')
export class CmsGallery {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  imageUrl!: string;

  @Column()
  title!: string;

  @Column()
  category!: string;
}
