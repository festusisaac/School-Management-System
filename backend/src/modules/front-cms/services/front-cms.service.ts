import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CmsHero } from '../entities/cms-hero.entity';
import { CmsCarouselImage } from '../entities/cms-carousel-image.entity';
import { CmsSection } from '../entities/cms-section.entity';
import { CmsStat } from '../entities/cms-stat.entity';
import { CmsTestimonial } from '../entities/cms-testimonial.entity';
import { CmsGallery } from '../entities/cms-gallery.entity';
import { CmsProgram } from '../entities/cms-program.entity';
import { CmsNews } from '../entities/cms-news.entity';
import { CmsContact } from '../entities/cms-contact.entity';
import { EmailService } from '../../internal-communication/email.service';
import { SystemSettingsService } from '../../system/services/system-settings.service';

import { extname, join } from 'path';
import * as fs from 'fs';

@Injectable()
export class FrontCmsService {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'front-cms');

  constructor(
    @InjectRepository(CmsHero) private heroRepo: Repository<CmsHero>,
    @InjectRepository(CmsCarouselImage) private carouselRepo: Repository<CmsCarouselImage>,
    @InjectRepository(CmsSection) private sectionRepo: Repository<CmsSection>,
    @InjectRepository(CmsStat) private statRepo: Repository<CmsStat>,
    @InjectRepository(CmsTestimonial) private testimonialRepo: Repository<CmsTestimonial>,
    @InjectRepository(CmsGallery) private galleryRepo: Repository<CmsGallery>,
    @InjectRepository(CmsProgram) private programRepo: Repository<CmsProgram>,
    @InjectRepository(CmsNews) private newsRepo: Repository<CmsNews>,
    @InjectRepository(CmsContact) private contactRepo: Repository<CmsContact>,
    private readonly emailService: EmailService,
    private readonly settingsService: SystemSettingsService,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // Media Library
  async getMediaLibrary() {
    if (!fs.existsSync(this.uploadDir)) return [];
    
    const files = fs.readdirSync(this.uploadDir);
    return files.map(file => {
      const stats = fs.statSync(join(this.uploadDir, file));
      return {
        name: file,
        size: stats.size,
        createdAt: stats.birthtime,
        url: `uploads/front-cms/${file}`
      };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteMediaFile(filename: string) {
    const filePath = join(this.uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true };
    }
    return { success: false, message: 'File not found' };
  }

  // Contact Submissions
  async createContactSubmission(data: any) {
    const contact = this.contactRepo.create(data);
    const savedContact = await this.contactRepo.save(contact);

    // Send email notification to school
    try {
      const settings = await this.settingsService.getSettings();
      if (settings.schoolEmail) {
        await this.emailService.sendNotificationEmail(
          settings.schoolEmail,
          `New Contact Inquiry: ${data.subject || 'General'}`,
          `
            <div style="font-family: sans-serif; color: #333;">
              <h2 style="color: #2563eb;">New Contact Submission</h2>
              <p><strong>From:</strong> ${data.fullName} (${data.email})</p>
              <p><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
              <p><strong>Subject:</strong> ${data.subject || 'General Inquiry'}</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 10px;">
                <p><strong>Message:</strong></p>
                <p>${data.message}</p>
              </div>
              <p style="font-size: 12px; color: #64748b; margin-top: 20px;">This message was sent from your website's contact form.</p>
            </div>
          `,
          'Website Contact Form',
          settings.schoolName
        );
      }
    } catch (error) {
      console.error('Failed to send contact notification email:', error);
    }

    return savedContact;
  }

  async getContacts() {
    return this.contactRepo.find({ order: { createdAt: 'DESC' } });
  }

  async markContactAsRead(id: string) {
    await this.contactRepo.update(id, { isRead: true });
    return this.contactRepo.findOne({ where: { id } });
  }

  async deleteContact(id: string) {
    return this.contactRepo.delete(id);
  }

  // Hero & Carousel
  async getHero() {
    let hero = await this.heroRepo.findOne({ 
      where: {}, 
      relations: ['carouselImages'],
      order: { carouselImages: { order: 'ASC' } }
    });
    if (!hero) {
      hero = this.heroRepo.create();
      await this.heroRepo.save(hero);
    }
    return hero;
  }

  async updateHero(data: any) {
    const hero = await this.getHero();
    Object.assign(hero, data);
    return this.heroRepo.save(hero);
  }

  async addCarouselImage(imageUrl: string) {
    const hero = await this.getHero();
    const image = this.carouselRepo.create({ imageUrl, hero, order: hero.carouselImages?.length || 0 });
    return this.carouselRepo.save(image);
  }

  async removeCarouselImage(id: number) {
    return this.carouselRepo.delete(id);
  }

  // Sections (About, Heritage)
  async getSection(key: string) {
    return this.sectionRepo.findOne({ where: { key } });
  }

  async updateSection(key: string, data: any) {
    const existingSection = await this.getSection(key);
    if (!existingSection) {
      const newSection = this.sectionRepo.create({ ...data, key });
      return this.sectionRepo.save(newSection);
    }
    Object.assign(existingSection, data);
    return this.sectionRepo.save(existingSection);
  }

  // Stats
  async getStats() {
    return this.statRepo.find({ order: { order: 'ASC' } });
  }

  async createStat(data: any) {
    const stat = this.statRepo.create(data);
    return this.statRepo.save(stat);
  }

  async updateStat(id: number, data: any) {
    await this.statRepo.update(id, data);
    return this.statRepo.findOne({ where: { id } });
  }

  async deleteStat(id: number) {
    return this.statRepo.delete(id);
  }

  // Testimonials
  async getTestimonials(onlyActive = false) {
    return this.testimonialRepo.find({ 
      where: onlyActive ? { isActive: true } : {},
    });
  }

  async createTestimonial(data: any) {
    const testimonial = this.testimonialRepo.create(data);
    return this.testimonialRepo.save(testimonial);
  }

  async updateTestimonial(id: number, data: any) {
    await this.testimonialRepo.update(id, data);
    return this.testimonialRepo.findOne({ where: { id } });
  }

  async deleteTestimonial(id: number) {
    return this.testimonialRepo.delete(id);
  }

  // Gallery
  async getGalleryItems() {
    return this.galleryRepo.find();
  }

  async createGalleryItem(data: any) {
    const item = this.galleryRepo.create(data);
    return this.galleryRepo.save(item);
  }

  async deleteGalleryItem(id: number) {
    return this.galleryRepo.delete(id);
  }

  // Programs
  async getPrograms() {
    return this.programRepo.find();
  }

  async createProgram(data: any) {
    const program = this.programRepo.create(data);
    return this.programRepo.save(program);
  }

  async updateProgram(id: number, data: any) {
    await this.programRepo.update(id, data);
    return this.programRepo.findOne({ where: { id } });
  }

  async deleteProgram(id: number) {
    return this.programRepo.delete(id);
  }

  // News
  async getAllNews() {
    return this.newsRepo.find({ order: { date: 'DESC' } });
  }

  async getNewsBySlug(slug: string) {
    return this.newsRepo.findOne({ where: { slug } });
  }

  async createNews(data: any) {
    if (!data.slug) {
      data.slug = data.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }
    const news = this.newsRepo.create(data);
    return this.newsRepo.save(news);
  }

  async updateNews(id: number, data: any) {
    await this.newsRepo.update(id, data);
    return this.newsRepo.findOne({ where: { id } });
  }

  async deleteNews(id: number) {
    return this.newsRepo.delete(id);
  }

  // Init Data for Landing Page
  async getPublicInitData() {
    const [hero, stats, testimonials, gallery, programs, news, about, heritage] = await Promise.all([
      this.getHero(),
      this.getStats(),
      this.getTestimonials(true),
      this.getGalleryItems(),
      this.getPrograms(),
      this.newsRepo.find({ take: 3, order: { date: 'DESC' } }),
      this.getSection('about'),
      this.getSection('heritage'),
    ]);

    return {
      hero,
      stats,
      testimonials,
      gallery,
      programs,
      news,
      sections: {
        about,
        heritage,
      }
    };
  }
}
