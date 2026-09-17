import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SystemSettingsService } from '../services/system-settings.service';
import { SystemSetting } from '../entities/system-setting.entity';
import { AcademicSession } from '../entities/academic-session.entity';
import { AcademicTerm } from '../entities/academic-term.entity';
import * as fs from 'fs';

jest.mock('fs');

describe('SystemSettingsService', () => {
  let service: SystemSettingsService;

  const mockRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockSettings = {
    id: 'settings_1',
    schoolName: 'Test School',
    primaryLogo: 'logo.png',
    schoolEmail: 'admin@test.com',
    schoolPhone: '1234567890',
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    admissionFee: 100,
    onlineAdmissionEnabled: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemSettingsService,
        { provide: getRepositoryToken(SystemSetting), useValue: mockRepo },
        { provide: getRepositoryToken(AcademicSession), useValue: mockRepo },
        { provide: getRepositoryToken(AcademicTerm), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<SystemSettingsService>(SystemSettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPublicSettings', () => {
    it('should return mapped public settings', async () => {
      // Mock getSettings which is called internally by getPublicSettings
      jest.spyOn(service, 'getSettings').mockResolvedValueOnce(mockSettings as any);

      const result = await service.getPublicSettings();

      expect(result.schoolName).toBe('Test School');
      expect(result.schoolLogo).toBe('logo.png');
      expect(result.admissionFee).toBe(100);
      expect(result.onlineAdmissionEnabled).toBe(true);
      expect(service.getSettings).toHaveBeenCalled();
    });
  });

  describe('getSettings', () => {
    it('should return existing settings with session and term names', async () => {
      mockRepo.find.mockResolvedValueOnce([{ id: '1', currentSessionId: 'sess_1', currentTermId: 'term_1' }]);
      mockRepo.findOne.mockResolvedValueOnce({ name: '2023/2024' }); // Session
      mockRepo.findOne.mockResolvedValueOnce({ name: 'Term 1' }); // Term

      const result = await service.getSettings();
      expect((result as any).currentSessionName).toBe('2023/2024');
      expect((result as any).currentTermName).toBe('Term 1');
    });

    it('should create default settings if none exist', async () => {
      mockRepo.find.mockResolvedValueOnce([]);
      mockRepo.create.mockReturnValueOnce({ schoolName: 'Your School Name' });
      mockRepo.save.mockResolvedValueOnce({ id: '1', schoolName: 'Your School Name' });

      const result = await service.getSettings();
      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result.schoolName).toBe('Your School Name');
    });
  });

  describe('updateSettings', () => {
    it('should update settings', async () => {
      mockRepo.find.mockResolvedValueOnce([{ id: '1', schoolName: 'Old' }]);
      mockRepo.save.mockImplementationOnce(val => Promise.resolve(val));

      const result = await service.updateSettings({ schoolName: 'New' });
      expect(result.schoolName).toBe('New');
      expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ schoolName: 'New' }));
    });
  });

  describe('updateLogo', () => {
    it('should throw error for invalid logo type', async () => {
      mockRepo.find.mockResolvedValueOnce([{}]);
      await expect(service.updateLogo('invalidType', 'path')).rejects.toThrow('Invalid logo type');
    });

    it('should update logo and remove old file if exists', async () => {
      const oldSettings = { id: '1', primaryLogo: 'old.png' };
      mockRepo.find.mockResolvedValueOnce([oldSettings]);
      mockRepo.save.mockImplementationOnce(val => Promise.resolve(val));
      
      (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
      (fs.unlinkSync as jest.Mock).mockReturnValueOnce(undefined);

      const result = await service.updateLogo('primaryLogo', 'new.png');
      expect((result as any).primaryLogo).toBe('new.png');
      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('should not throw if file removal fails', async () => {
      const oldSettings = { id: '1', primaryLogo: '/old.png' };
      mockRepo.find.mockResolvedValueOnce([oldSettings]);
      mockRepo.save.mockImplementationOnce(val => Promise.resolve(val));
      
      (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
      (fs.unlinkSync as jest.Mock).mockImplementationOnce(() => { throw new Error('fs error'); });

      const result = await service.updateLogo('primaryLogo', 'new.png');
      expect((result as any).primaryLogo).toBe('new.png');
    });
  });

  describe('deleteLogo', () => {
    it('should throw error for invalid logo type', async () => {
      mockRepo.find.mockResolvedValueOnce([{}]);
      await expect(service.deleteLogo('invalidType')).rejects.toThrow('Invalid logo type');
    });

    it('should delete logo and set field to null', async () => {
      const oldSettings = { id: '1', primaryLogo: 'old.png' };
      mockRepo.find.mockResolvedValueOnce([oldSettings]);
      mockRepo.save.mockImplementationOnce(val => Promise.resolve(val));
      
      (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
      (fs.unlinkSync as jest.Mock).mockReturnValueOnce(undefined);

      const result = await service.deleteLogo('primaryLogo');
      expect((result as any).primaryLogo).toBeNull();
      expect(fs.unlinkSync).toHaveBeenCalled();
    });
  });

  describe('getActiveSessionId', () => {
    it('should return active session id', async () => {
      mockRepo.find.mockResolvedValueOnce([{ currentSessionId: 'sess_1' }]);
      const result = await service.getActiveSessionId();
      expect(result).toBe('sess_1');
    });

    it('should return null if no active session', async () => {
      mockRepo.find.mockResolvedValueOnce([{}]);
      const result = await service.getActiveSessionId();
      expect(result).toBeNull();
    });
  });

  describe('getActiveTermId', () => {
    it('should return active term id', async () => {
      mockRepo.find.mockResolvedValueOnce([{ currentTermId: 'term_1' }]);
      const result = await service.getActiveTermId();
      expect(result).toBe('term_1');
    });
  });
});
