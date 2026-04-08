import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseInterceptors, 
  UploadedFile, 
  ParseIntPipe 
} from '@nestjs/common';
import { FrontCmsService } from '../services/front-cms.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

import { Public } from '@decorators/public.decorator';
import { ApiTags } from '@nestjs/swagger';
import { CreateCmsContactDto } from '../dtos/create-cms-contact.dto';

@ApiTags('Front CMS')
@Controller('front-cms')
export class FrontCmsController {
  constructor(private readonly cmsService: FrontCmsService) {}

  // Contact Submissions
  @Public()
  @Post('contact')
  async createContact(@Body() data: CreateCmsContactDto) {
    return this.cmsService.createContactSubmission(data);
  }

  @Get('contacts')
  async getContacts() {
    return this.cmsService.getContacts();
  }

  @Put('contacts/:id/read')
  async markAsRead(@Param('id') id: string) {
    return this.cmsService.markContactAsRead(id);
  }

  @Delete('contacts/:id')
  async deleteContact(@Param('id') id: string) {
    return this.cmsService.deleteContact(id);
  }

  // Media Library
  @Get('media')
  async getMediaLibrary() {
    return this.cmsService.getMediaLibrary();
  }

  @Delete('media/:filename')
  async deleteMediaFile(@Param('filename') filename: string) {
    return this.cmsService.deleteMediaFile(filename);
  }

  @Post('media/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', '..', '..', 'uploads', 'front-cms'),
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `media-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadMedia(@UploadedFile() file: Express.Multer.File) {
    const relativePath = `uploads/front-cms/${file.filename}`;
    return { url: relativePath, name: file.filename };
  }

  // Public Endpoints
  @Public()
  @Get('public/init')
  async getInitData() {
    return this.cmsService.getPublicInitData();
  }

  @Public()
  @Get('public/news')
  async getPublicNews() {
    return this.cmsService.getAllNews();
  }

  // Hero & Carousel
  @Get('hero')
  async getHero() {
    return this.cmsService.getHero();
  }

  @Put('hero')
  async updateHero(@Body() data: any) {
    return this.cmsService.updateHero(data);
  }

  @Post('hero/carousel')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', '..', '..', 'uploads', 'front-cms'),
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `hero-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async addCarouselImage(
    @Body('imageUrl') imageUrl?: string,
    @UploadedFile() file?: Express.Multer.File
  ) {
    const finalUrl = file ? `uploads/front-cms/${file.filename}` : imageUrl;
    if (!finalUrl) throw new Error('Image URL or File is required');
    return this.cmsService.addCarouselImage(finalUrl);
  }

  @Delete('hero/carousel/:id')
  async removeCarouselImage(@Param('id', ParseIntPipe) id: number) {
    return this.cmsService.removeCarouselImage(id);
  }

  // Sections (About, Heritage)
  @Get('section/:key')
  async getSection(@Param('key') key: string) {
    return this.cmsService.getSection(key);
  }

  @Put('section/:key')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', '..', '..', 'uploads', 'front-cms'),
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `section-${req.params.key}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async updateSection(
    @Param('key') key: string, 
    @Body() data: any, 
    @UploadedFile() file?: Express.Multer.File
  ) {
    if (file) {
      data.imageUrl = `uploads/front-cms/${file.filename}`;
    }
    return this.cmsService.updateSection(key, data);
  }

  // Stats
  @Get('stats')
  async getStats() {
    return this.cmsService.getStats();
  }

  @Post('stats')
  async createStat(@Body() data: any) {
    return this.cmsService.createStat(data);
  }

  @Put('stats/:id')
  async updateStat(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.cmsService.updateStat(id, data);
  }

  @Delete('stats/:id')
  async deleteStat(@Param('id', ParseIntPipe) id: number) {
    return this.cmsService.deleteStat(id);
  }

  // Testimonials
  @Get('testimonials')
  async getTestimonials() {
    return this.cmsService.getTestimonials();
  }

  @Post('testimonials')
  async createTestimonial(@Body() data: any) {
    return this.cmsService.createTestimonial(data);
  }

  @Put('testimonials/:id')
  async updateTestimonial(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.cmsService.updateTestimonial(id, data);
  }

  @Delete('testimonials/:id')
  async deleteTestimonial(@Param('id', ParseIntPipe) id: number) {
    return this.cmsService.deleteTestimonial(id);
  }

  // News
  @Get('news')
  async getAllNews() {
    return this.cmsService.getAllNews();
  }

  @Post('news')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', '..', '..', 'uploads', 'front-cms'),
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `news-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async createNews(@Body() data: any, @UploadedFile() file?: Express.Multer.File) {
    if (file) {
      data.imageUrl = `uploads/front-cms/${file.filename}`;
    }
    return this.cmsService.createNews(data);
  }

  @Put('news/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', '..', '..', 'uploads', 'front-cms'),
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `news-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async updateNews(@Param('id', ParseIntPipe) id: number, @Body() data: any, @UploadedFile() file?: Express.Multer.File) {
    if (file) {
      data.imageUrl = `uploads/front-cms/${file.filename}`;
    }
    return this.cmsService.updateNews(id, data);
  }

  @Delete('news/:id')
  async deleteNews(@Param('id', ParseIntPipe) id: number) {
    return this.cmsService.deleteNews(id);
  }

  // Gallery
  @Get('gallery')
  async getGalleryItems() {
    return this.cmsService.getGalleryItems();
  }

  @Post('gallery')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', '..', '..', 'uploads', 'front-cms'),
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `gallery-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async createGalleryItem(@Body() data: any, @UploadedFile() file?: Express.Multer.File) {
    if (file) {
      data.imageUrl = `uploads/front-cms/${file.filename}`;
    }
    if (!data.imageUrl) throw new Error('Image URL or File is required');
    return this.cmsService.createGalleryItem(data);
  }

  @Delete('gallery/:id')
  async deleteGalleryItem(@Param('id', ParseIntPipe) id: number) {
    return this.cmsService.deleteGalleryItem(id);
  }

  // Programs
  @Get('programs')
  async getPrograms() {
    return this.cmsService.getPrograms();
  }

  @Post('programs')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', '..', '..', 'uploads', 'front-cms'),
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `program-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async createProgram(@Body() data: any, @UploadedFile() file?: Express.Multer.File) {
    if (file) {
      data.imageUrl = `uploads/front-cms/${file.filename}`;
    }
    if (!data.imageUrl) throw new Error('Image URL or File is required');
    return this.cmsService.createProgram(data);
  }

  @Put('programs/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', '..', '..', 'uploads', 'front-cms'),
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `program-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async updateProgram(@Param('id', ParseIntPipe) id: number, @Body() data: any, @UploadedFile() file?: Express.Multer.File) {
    if (file) {
      data.imageUrl = `uploads/front-cms/${file.filename}`;
    }
    return this.cmsService.updateProgram(id, data);
  }

  @Delete('programs/:id')
  async deleteProgram(@Param('id', ParseIntPipe) id: number) {
    return this.cmsService.deleteProgram(id);
  }
}
