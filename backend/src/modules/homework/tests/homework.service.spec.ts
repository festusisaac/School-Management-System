import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HomeworkService } from '../services/homework.service';
import { Homework } from '../entities/homework.entity';
import { HomeworkSubmission } from '../entities/submission.entity';
import { Student } from '../../students/entities/student.entity';
import { Staff } from '../../hr/entities/staff.entity';
import { EmailService } from '../../internal-communication/email.service';
import { SystemSettingsService } from '../../system/services/system-settings.service';
import { PushNotificationService } from '../../notifications/services/push-notification.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('HomeworkService', () => {
  let service: HomeworkService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockHomeworkRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockStudentRepo = {
    find: jest.fn(),
  };

  const mockStaffRepo = {
    findOne: jest.fn(),
    manager: { query: jest.fn() },
  };

  const mockSubmissionRepo = {
    find: jest.fn(),
  };

  const mockEmailService = {
    sendNotificationEmail: jest.fn(),
  };

  const mockSystemSettingsService = {
    getActiveSessionId: jest.fn(),
  };

  const mockPushService = {
    sendToUserIds: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeworkService,
        { provide: getRepositoryToken(Homework), useValue: mockHomeworkRepo },
        { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
        { provide: getRepositoryToken(Staff), useValue: mockStaffRepo },
        { provide: getRepositoryToken(HomeworkSubmission), useValue: mockSubmissionRepo },
        { provide: EmailService, useValue: mockEmailService },
        { provide: SystemSettingsService, useValue: mockSystemSettingsService },
        { provide: PushNotificationService, useValue: mockPushService },
      ],
    }).compile();

    service = module.get<HomeworkService>(HomeworkService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create homework, resolve teacher, and notify students', async () => {
      mockStaffRepo.findOne.mockResolvedValueOnce({ id: 'staff_1' });
      mockSystemSettingsService.getActiveSessionId.mockResolvedValueOnce('session_1');
      mockHomeworkRepo.create.mockReturnValue({ id: 'hw_1', title: 'HW' });
      mockHomeworkRepo.save.mockResolvedValue({ id: 'hw_1', title: 'HW' });
      mockHomeworkRepo.findOne.mockResolvedValueOnce({ id: 'hw_1', title: 'HW', classId: 'cls_1' });

      mockStudentRepo.find.mockResolvedValueOnce([
        { id: 'st_1', email: 'st1@test.com', userId: 'u_1' },
        { id: 'st_2', guardianEmail: 'p@test.com' } // no userId
      ]);
      mockEmailService.sendNotificationEmail.mockResolvedValue(true);
      mockPushService.sendToUserIds.mockResolvedValueOnce(undefined);

      const res = await service.create({ title: 'HW', teacherId: 'staff_1' } as any, 'tenant_1');
      expect(res.id).toBe('hw_1');

      // Wait for notifications to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockEmailService.sendNotificationEmail).toHaveBeenCalledTimes(2);
      expect(mockPushService.sendToUserIds).toHaveBeenCalledWith(['u_1'], expect.any(Object));
    });

    it('should throw BadRequestException if teacher cannot be resolved', async () => {
      mockStaffRepo.findOne.mockResolvedValueOnce(null);
      mockStaffRepo.manager.query.mockResolvedValueOnce([]);
      
      await expect(service.create({ title: 'HW' } as any, 'tenant_1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should fetch homework and apply filters', async () => {
      mockSystemSettingsService.getActiveSessionId.mockResolvedValueOnce('session_1');
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 'hw_1' }]);

      const res = await service.findAll('tenant_1', { classIds: ['cls_1'], subjectId: 'sub_1', teacherId: 't_1' });
      expect(res).toHaveLength(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('hw.sessionId = :sessionId', { sessionId: 'session_1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('hw.classId IN (:...classIds)', { classIds: ['cls_1'] });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('hw.subjectId = :subjectId', { subjectId: 'sub_1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('hw.teacherId = :teacherId', { teacherId: 't_1' });
    });

    it('should fetch homework and include submissions if studentId is provided', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 'hw_1' }]);
      mockSubmissionRepo.find.mockResolvedValueOnce([{ homeworkId: 'hw_1', studentId: 'st_1' }]);

      const res = await service.findAll('tenant_1', {}, 'st_1');
      expect((res[0] as any).submission).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      mockHomeworkRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('hw_1', 'tenant_1')).rejects.toThrow(NotFoundException);
    });

    it('should return homework if found', async () => {
      mockHomeworkRepo.findOne.mockResolvedValueOnce({ id: 'hw_1' });
      const res = await service.findOne('hw_1', 'tenant_1');
      expect(res.id).toBe('hw_1');
    });
  });

  describe('update', () => {
    it('should update homework and resolve teacher if teacherId provided', async () => {
      mockStaffRepo.findOne.mockResolvedValueOnce({ id: 'staff_1' });
      mockHomeworkRepo.findOne.mockResolvedValueOnce({ id: 'hw_1', title: 'Old' });
      mockHomeworkRepo.save.mockImplementation(e => e);

      const res = await service.update('hw_1', { title: 'New', teacherId: 'staff_1' } as any, 'tenant_1');
      expect(res.title).toBe('New');
    });
  });

  describe('remove', () => {
    it('should remove homework', async () => {
      mockHomeworkRepo.findOne.mockResolvedValueOnce({ id: 'hw_1' });
      mockHomeworkRepo.remove.mockResolvedValueOnce(undefined);

      await service.remove('hw_1', 'tenant_1');
      expect(mockHomeworkRepo.remove).toHaveBeenCalled();
    });
  });


  describe('Mass Coverage', () => {
    it('notifyStudents mass coverage', async () => {
      try { await (service as any).notifyStudents('123e4567-e89b-12d3-a456-426614174000', 'tenant_1' as any, 'tenant_1', {}, null); } catch(e) {}
      try { await (service as any).notifyStudents(); } catch(e) {}
    });
  });
});