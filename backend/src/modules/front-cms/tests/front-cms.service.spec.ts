import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FrontCmsService } from '../services/front-cms.service';
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
import * as fs from 'fs';

jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('FrontCmsService', () => {
  let service: FrontCmsService;

  const createMockRepo = () => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  });

  const mockEmailService = {
    sendNotificationEmail: jest.fn(),
  };

  const mockSettingsService = {
    getSettings: jest.fn(),
  };

  const mockRepos: any = {
    heroRepo: createMockRepo(),
    carouselRepo: createMockRepo(),
    sectionRepo: createMockRepo(),
    statRepo: createMockRepo(),
    testimonialRepo: createMockRepo(),
    galleryRepo: createMockRepo(),
    programRepo: createMockRepo(),
    newsRepo: createMockRepo(),
    contactRepo: createMockRepo(),
  };

  beforeEach(async () => {
    mockedFs.existsSync.mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FrontCmsService,
        { provide: getRepositoryToken(CmsHero), useValue: mockRepos.heroRepo },
        { provide: getRepositoryToken(CmsCarouselImage), useValue: mockRepos.carouselRepo },
        { provide: getRepositoryToken(CmsSection), useValue: mockRepos.sectionRepo },
        { provide: getRepositoryToken(CmsStat), useValue: mockRepos.statRepo },
        { provide: getRepositoryToken(CmsTestimonial), useValue: mockRepos.testimonialRepo },
        { provide: getRepositoryToken(CmsGallery), useValue: mockRepos.galleryRepo },
        { provide: getRepositoryToken(CmsProgram), useValue: mockRepos.programRepo },
        { provide: getRepositoryToken(CmsNews), useValue: mockRepos.newsRepo },
        { provide: getRepositoryToken(CmsContact), useValue: mockRepos.contactRepo },
        { provide: EmailService, useValue: mockEmailService },
        { provide: SystemSettingsService, useValue: mockSettingsService },
      ],
    }).compile();

    service = module.get<FrontCmsService>(FrontCmsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createContactSubmission', () => {
    it('should save contact and send email', async () => {
      mockRepos.contactRepo.create.mockReturnValue({ id: 'c_1' });
      mockRepos.contactRepo.save.mockResolvedValue({ id: 'c_1' });
      mockSettingsService.getSettings.mockResolvedValueOnce({ schoolEmail: 'admin@school.com', schoolName: 'School' });
      mockEmailService.sendNotificationEmail.mockResolvedValueOnce(true);

      const res = await service.createContactSubmission({ fullName: 'John Doe', email: 'john@test.com', message: 'Hello' });
      expect((res as any).id).toBe('c_1');
      expect(mockEmailService.sendNotificationEmail).toHaveBeenCalled();
    });
  });

  describe('getHero / updateHero', () => {
    it('should create hero if not exists and return', async () => {
      mockRepos.heroRepo.findOne.mockResolvedValueOnce(null);
      mockRepos.heroRepo.create.mockReturnValue({ id: 1 });
      mockRepos.heroRepo.save.mockResolvedValue({ id: 1 });

      const res = await service.getHero();
      expect(res.id).toBe(1);
      expect(mockRepos.heroRepo.create).toHaveBeenCalled();
    });

    it('should update hero', async () => {
      mockRepos.heroRepo.findOne.mockResolvedValueOnce({ id: 1, title: 'Old' });
      mockRepos.heroRepo.save.mockImplementation((e: any) => e);

      const res = await service.updateHero({ title: 'New' });
      expect(res.title).toBe('New');
    });
  });

  describe('updateSection', () => {
    it('should create new section if it does not exist', async () => {
      mockRepos.sectionRepo.findOne.mockResolvedValueOnce(null);
      mockRepos.sectionRepo.create.mockReturnValue({ id: 1, key: 'about' });
      mockRepos.sectionRepo.save.mockResolvedValue({ id: 1, key: 'about' });

      const res = await service.updateSection('about', { title: 'T' });
      expect(mockRepos.sectionRepo.create).toHaveBeenCalled();
      expect((res as any).id).toBe(1);
    });

    it('should update existing section', async () => {
      mockRepos.sectionRepo.findOne.mockResolvedValueOnce({ id: 1, key: 'about', title: 'Old' });
      mockRepos.sectionRepo.save.mockImplementation((e: any) => e);

      const res = await service.updateSection('about', { title: 'New' });
      expect((res as any).title).toBe('New');
    });
  });

  describe('getPublicInitData', () => {
    it('should return all required public data', async () => {
      mockRepos.heroRepo.findOne.mockResolvedValueOnce({ id: 1 });
      mockRepos.statRepo.find.mockResolvedValueOnce([]);
      mockRepos.testimonialRepo.find.mockResolvedValueOnce([]);
      mockRepos.galleryRepo.find.mockResolvedValueOnce([]);
      mockRepos.programRepo.find.mockResolvedValueOnce([]);
      mockRepos.newsRepo.find.mockResolvedValueOnce([]);
      mockRepos.sectionRepo.findOne.mockResolvedValueOnce({ key: 'about' }).mockResolvedValueOnce({ key: 'heritage' });

      const res = await service.getPublicInitData();
      expect(res.hero).toBeDefined();
      expect(res.stats).toBeDefined();
      expect(res.testimonials).toBeDefined();
      expect(res.sections.about).toBeDefined();
    });
  });

  describe('Media Library', () => {
    it('should delete media file if exists', async () => {
      mockedFs.existsSync.mockReturnValueOnce(true);
      mockedFs.unlinkSync.mockReturnValueOnce(undefined);

      const res = await service.deleteMediaFile('test.jpg');
      expect(res.success).toBe(true);
      expect(mockedFs.unlinkSync).toHaveBeenCalled();
    });

    it('should return false if media file not exists', async () => {
      mockedFs.existsSync.mockReturnValueOnce(false);

      const res = await service.deleteMediaFile('test.jpg');
      expect(res.success).toBe(false);
    });
  });
});
