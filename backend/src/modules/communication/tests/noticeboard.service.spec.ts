import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NoticeboardService } from '../services/noticeboard.service';
import { Notice, NoticeAudience } from '../entities/notice.entity';
import { Staff } from '../../hr/entities/staff.entity';
import { SystemSettingsService } from '../../system/services/system-settings.service';
import { PushNotificationService } from '../../notifications/services/push-notification.service';
import { NotFoundException } from '@nestjs/common';

describe('NoticeboardService', () => {
  let service: NoticeboardService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockNoticeRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    manager: { query: jest.fn() },
  };

  const mockStaffRepo = {
    findOne: jest.fn(),
  };

  const mockSystemSettingsService = { getSettings: jest.fn() };
  const mockPushService = {
    getStaffUserIds: jest.fn(),
    getStudentUserIds: jest.fn(),
    sendToUserIds: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoticeboardService,
        { provide: getRepositoryToken(Notice), useValue: mockNoticeRepo },
        { provide: getRepositoryToken(Staff), useValue: mockStaffRepo },
        { provide: SystemSettingsService, useValue: mockSystemSettingsService },
        { provide: PushNotificationService, useValue: mockPushService },
      ],
    }).compile();

    service = module.get<NoticeboardService>(NoticeboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create notice and push notification if staff found', async () => {
      mockStaffRepo.findOne.mockResolvedValueOnce({ id: 'st_1' });
      mockNoticeRepo.create.mockReturnValue({ id: 'n_1', targetAudience: NoticeAudience.ALL });
      mockNoticeRepo.save.mockResolvedValue({ id: 'n_1', title: 'T', targetAudience: NoticeAudience.ALL });
      
      mockPushService.getStaffUserIds.mockResolvedValueOnce(['u_1']);
      mockPushService.getStudentUserIds.mockResolvedValueOnce(['u_2']);
      mockPushService.sendToUserIds.mockResolvedValueOnce(undefined);

      const res = await service.create({ title: 'T', content: 'C', targetAudience: NoticeAudience.ALL }, 'user_1', 'tenant_1', 'staff@test.com');
      
      // Wait for the floating promise to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(res.id).toBe('n_1');
      expect(mockPushService.sendToUserIds).toHaveBeenCalledWith(['u_1', 'u_2'], expect.any(Object));
    });
  });

  describe('findAll', () => {
    it('should return notices and resolve placeholders', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 'n_1', title: 'Hello {school_name}' }]);
      mockSystemSettingsService.getSettings.mockResolvedValueOnce({ schoolName: 'Test School' });

      const res = await service.findAll('tenant_1', NoticeAudience.ALL, 'sec_1');
      expect(res[0].title).toBe('Hello Test School');
    });
  });

  describe('findAllForAdmin', () => {
    it('should return admin notices and resolve placeholders', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 'n_1', title: 'Admin {school_name}' }]);
      mockSystemSettingsService.getSettings.mockResolvedValueOnce({ schoolName: 'Test School' });

      const res = await service.findAllForAdmin('tenant_1', 'sec_1');
      expect(res[0].title).toBe('Admin Test School');
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      mockNoticeRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('n_1', 'tenant_1')).rejects.toThrow(NotFoundException);
    });

    it('should return notice and resolve placeholders', async () => {
      mockNoticeRepo.findOne.mockResolvedValueOnce({ id: 'n_1', title: 'Hello {school_name}' });
      mockSystemSettingsService.getSettings.mockResolvedValueOnce({ schoolName: 'Test School' });

      const res = await service.findOne('n_1', 'tenant_1');
      expect(res.title).toBe('Hello Test School');
    });
  });

  describe('update', () => {
    it('should update notice', async () => {
      mockNoticeRepo.findOne.mockResolvedValueOnce({ id: 'n_1', title: 'Old' });
      mockSystemSettingsService.getSettings.mockResolvedValue({ schoolName: 'Test School' });
      mockNoticeRepo.save.mockImplementation(e => e);

      const res = await service.update('n_1', { title: 'New' }, 'tenant_1');
      expect(res.title).toBe('New'); // Note: it will try to resolve placeholders during findOne, which we mock correctly.
    });
  });

  describe('remove', () => {
    it('should remove notice', async () => {
      mockNoticeRepo.findOne.mockResolvedValueOnce({ id: 'n_1' });
      mockSystemSettingsService.getSettings.mockResolvedValue({ schoolName: 'Test School' });
      mockNoticeRepo.remove.mockResolvedValueOnce(undefined);

      await service.remove('n_1', 'tenant_1');
      expect(mockNoticeRepo.remove).toHaveBeenCalled();
    });
  });
});
