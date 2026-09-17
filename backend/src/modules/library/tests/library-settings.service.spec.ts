import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LibrarySettingsService } from '../library-settings.service';
import { LibrarySetting } from '../entities/library-setting.entity';

describe('LibrarySettingsService', () => {
  let service: LibrarySettingsService;

  const mockSettingsRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LibrarySettingsService,
        { provide: getRepositoryToken(LibrarySetting), useValue: mockSettingsRepo },
      ],
    }).compile();

    service = module.get<LibrarySettingsService>(LibrarySettingsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSettings', () => {
    it('should return settings if found', async () => {
      mockSettingsRepo.findOne.mockResolvedValueOnce({ id: 's_1' });
      const res = await service.getSettings('tenant_1');
      expect(res).toEqual({ id: 's_1' });
    });

    it('should return null if not found', async () => {
      mockSettingsRepo.findOne.mockResolvedValueOnce(null);
      const res = await service.getSettings('tenant_1');
      expect(res).toBeNull();
    });
  });

  describe('upsertSettings', () => {
    it('should create new setting if none exists', async () => {
      mockSettingsRepo.findOne.mockResolvedValueOnce(null);
      mockSettingsRepo.create.mockReturnValue({ graceDays: 3, finePerDay: 50 });
      mockSettingsRepo.save.mockResolvedValue({ id: 's_1', graceDays: 3, finePerDay: 50 });

      const res = await service.upsertSettings('tenant_1', { graceDays: 3, finePerDay: 50 });
      expect(res.id).toBe('s_1');
      expect(mockSettingsRepo.create).toHaveBeenCalled();
    });

    it('should update existing setting', async () => {
      mockSettingsRepo.findOne.mockResolvedValueOnce({ id: 's_1', graceDays: 1, finePerDay: 10 });
      mockSettingsRepo.save.mockImplementation(e => e);

      const res = await service.upsertSettings('tenant_1', { graceDays: 5, finePerDay: 100 });
      expect(res.graceDays).toBe(5);
      expect(res.finePerDay).toBe(100);
    });
  });
});
