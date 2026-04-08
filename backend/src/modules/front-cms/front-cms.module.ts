import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FrontCmsService } from './services/front-cms.service';
import { FrontCmsController } from './controllers/front-cms.controller';
import { CmsHero } from './entities/cms-hero.entity';
import { CmsCarouselImage } from './entities/cms-carousel-image.entity';
import { CmsSection } from './entities/cms-section.entity';
import { CmsStat } from './entities/cms-stat.entity';
import { CmsTestimonial } from './entities/cms-testimonial.entity';
import { CmsGallery } from './entities/cms-gallery.entity';
import { CmsProgram } from './entities/cms-program.entity';
import { CmsNews } from './entities/cms-news.entity';
import { CmsContact } from './entities/cms-contact.entity';
import { InternalCommunicationModule } from '../internal-communication/internal-communication.module';
import { SystemModule } from '../system/system.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CmsHero,
      CmsCarouselImage,
      CmsSection,
      CmsStat,
      CmsTestimonial,
      CmsGallery,
      CmsProgram,
      CmsNews,
      CmsContact,
    ]),
    InternalCommunicationModule,
    SystemModule,
  ],
  controllers: [FrontCmsController],
  providers: [FrontCmsService],
  exports: [FrontCmsService],
})
export class FrontCmsModule {}
