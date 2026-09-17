import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OnlineClassesService } from '../services/online-classes.service';
import { OnlineClass, OnlineClassStatus } from '../entities/online-class.entity';
import { Student } from '../../students/entities/student.entity';
import { EmailService } from '../../internal-communication/email.service';
import { NotFoundException } from '@nestjs/common';

describe('OnlineClassesService', () => {
  let service: OnlineClassesService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockOnlineClassRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockStudentRepo = {
    find: jest.fn(),
  };

  const mockEmailService = {
    sendNotificationEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnlineClassesService,
        { provide: getRepositoryToken(OnlineClass), useValue: mockOnlineClassRepo },
        { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<OnlineClassesService>(OnlineClassesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create online class and notify students', async () => {
      mockOnlineClassRepo.create.mockReturnValue({ id: 'oc_1' });
      mockOnlineClassRepo.save.mockResolvedValue({ id: 'oc_1' });
      mockOnlineClassRepo.findOne.mockResolvedValueOnce({ id: 'oc_1', classId: 'cls_1', title: 'T' });
      mockStudentRepo.find.mockResolvedValueOnce([{ email: 'st@test.com' }]);
      mockEmailService.sendNotificationEmail.mockResolvedValue(true);

      const res = await service.create({ title: 'T' } as any, 'tenant_1');
      expect(res.id).toBe('oc_1');

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(mockEmailService.sendNotificationEmail).toHaveBeenCalledWith('st@test.com', expect.any(String), expect.any(String), expect.any(String));
    });
  });

  describe('findAll', () => {
    it('should fetch online classes with filters', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 'oc_1' }]);

      const res = await service.findAll('tenant_1', { classId: 'cls_1', status: OnlineClassStatus.SCHEDULED });
      expect(res).toHaveLength(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('oc.classId = :classId', { classId: 'cls_1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('oc.status = :status AND oc.endTime > :now', expect.any(Object));
    });

    it('should fetch COMPLETED classes', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 'oc_1' }]);

      await service.findAll('tenant_1', { status: OnlineClassStatus.COMPLETED });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('(oc.status = :status OR oc.endTime <= :now)', expect.any(Object));
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      mockOnlineClassRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('oc_1', 'tenant_1')).rejects.toThrow(NotFoundException);
    });

    it('should return if found', async () => {
      mockOnlineClassRepo.findOne.mockResolvedValueOnce({ id: 'oc_1' });
      const res = await service.findOne('oc_1', 'tenant_1');
      expect(res.id).toBe('oc_1');
    });
  });

  describe('update', () => {
    it('should update online class', async () => {
      mockOnlineClassRepo.findOne.mockResolvedValueOnce({ id: 'oc_1' });
      mockOnlineClassRepo.save.mockImplementation(e => e);

      const res = await service.update('oc_1', { title: 'New' } as any, 'tenant_1');
      expect(res.title).toBe('New');
    });
  });

  describe('remove', () => {
    it('should remove online class', async () => {
      mockOnlineClassRepo.findOne.mockResolvedValueOnce({ id: 'oc_1' });
      mockOnlineClassRepo.remove.mockResolvedValueOnce(undefined);

      await service.remove('oc_1', 'tenant_1');
      expect(mockOnlineClassRepo.remove).toHaveBeenCalled();
    });
  });

  describe('findUpcoming', () => {
    it('should find upcoming classes', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 'oc_1' }]);

      const res = await service.findUpcoming('tenant_1', 'cls_1');
      expect(res).toHaveLength(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('oc.classId = :classId', { classId: 'cls_1' });
    });
  });
});
