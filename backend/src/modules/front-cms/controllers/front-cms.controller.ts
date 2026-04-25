import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards,
  UseInterceptors, 
  UploadedFile, 
  ParseIntPipe 
} from '@nestjs/common';
import { FrontCmsService } from '../services/front-cms.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

import { Public } from '@decorators/public.decorator';
import { Permissions } from '@decorators/permissions.decorator';
import { PermissionsGuard } from '@guards/permissions.guard';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { CreateCmsContactDto } from '../dtos/create-cms-contact.dto';

@ApiTags('Front CMS')
@Controller('front-cms')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FrontCmsController {
  constructor(private readonly cmsService: FrontCmsService) {}

  // Contact Submissions
  @Public()
  @Post('contact')
  async createContact(@Body() data: CreateCmsContactDto) {
    return this.cmsService.createContactSubmission(data);
  }

  @Get('contacts')
  @Permissions('front_cms:manage')
  async getContacts() {
    return this.cmsService.getContacts();
  }

  @Put('contacts/:id/read')
  @Permissions('front_cms:manage')
  async markAsRead(@Param('id') id: string) {
    return this.cmsService.markContactAsRead(id);
  }

  @Delete('contacts/:id')
  @Permissions('front_cms:manage')
  async deleteContact(@Param('id') id: string) {
    return this.cmsService.deleteContact(id);
  }

  // Media Library
  @Get('media')
  @Permissions('front_cms:manage')
  async getMediaLibrary() {
    return this.cmsService.getMediaLibrary();
  }

  @Delete('media/:filename')
  @Permissions('front_cms:manage')
  async deleteMediaFile(@Param('filename') filename: string) {
    return this.cmsService.deleteMediaFile(filename);
  }

  @Post('media/upload')
  @Permissions('front_cms:manage')
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
  @Permissions('front_cms:manage')
  async getHero() {
    return this.cmsService.getHero();
  }

  @Put('hero')
  @Permissions('front_cms:manage')
  async updateHero(@Body() data: any) {
    return this.cmsService.updateHero(data);
  }

  @Post('hero/carousel')
  @Permissions('front_cms:manage')
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
  @Permissions('front_cms:manage')
  async removeCarouselImage(@Param('id', ParseIntPipe) id: number) {
    return this.cmsService.removeCarouselImage(id);
  }

  // Sections (About, Heritage)
  @Get('section/:key')
  @Permissions('front_cms:manage')
  async getSection(@Param('key') key: string) {
    return this.cmsService.getSection(key);
  }

  @Put('section/:key')
  @Permissions('front_cms:manage')
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
  @Permissions('front_cms:manage')
  async getStats() {
    return this.cmsService.getStats();
  }

  @Post('stats')
  @Permissions('front_cms:manage')
  async createStat(@Body() data: any) {
    return this.cmsService.createStat(data);
  }

  @Put('stats/:id')
  @Permissions('front_cms:manage')
  async updateStat(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.cmsService.updateStat(id, data);
  }

  @Delete('stats/:id')
  @Permissions('front_cms:manage')
  async deleteStat(@Param('id', ParseIntPipe) id: number) {
    return this.cmsService.deleteStat(id);
  }

  // Testimonials
  @Get('testimonials')
  @Permissions('front_cms:manage')
  async getTestimonials() {
    return this.cmsService.getTestimonials();
  }

  @Post('testimonials')
  @Permissions('front_cms:manage')
  async createTestimonial(@Body() data: any) {
    return this.cmsService.createTestimonial(data);
  }

  @Put('testimonials/:id')
  @Permissions('front_cms:manage')
  async updateTestimonial(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.cmsService.updateTestimonial(id, data);
  }

  @Delete('testimonials/:id')
  @Permissions('front_cms:manage')
  async deleteTestimonial(@Param('id', ParseIntPipe) id: number) {
    return this.cmsService.deleteTestimonial(id);
  }

  // News
  @Get('news')
  @Permissions('front_cms:manage')
  async getAllNews() {
    return this.cmsService.getAllNews();
  }

  @Post('news')
  @Permissions('front_cms:manage')
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
  @Permissions('front_cms:manage')
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
  @Permissions('front_cms:manage')
  async deleteNews(@Param('id', ParseIntPipe) id: number) {
    return this.cmsService.deleteNews(id);
  }

  // Gallery
  @Get('gallery')
  @Permissions('front_cms:manage')
  async getGalleryItems() {
    return this.cmsService.getGalleryItems();
  }

  @Post('gallery')
  @Permissions('front_cms:manage')
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
  @Permissions('front_cms:manage')
  async deleteGalleryItem(@Param('id', ParseIntPipe) id: number) {
    return this.cmsService.deleteGalleryItem(id);
  }

  // Programs
  @Get('programs')
  @Permissions('front_cms:manage')
  async getPrograms() {
    return this.cmsService.getPrograms();
  }

  @Post('programs')
  @Permissions('front_cms:manage')
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
  @Permissions('front_cms:manage')
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
  @Permissions('front_cms:manage')
  async deleteProgram(@Param('id', ParseIntPipe) id: number) {
    return this.cmsService.deleteProgram(id);
  }
}
