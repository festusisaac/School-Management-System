import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { LessonNotesService } from '../services/lesson-notes.service';
import { LessonNote } from '../entities/lesson-note.entity';
import { EmailService } from '../../internal-communication/email.service';
import { User } from '../../auth/entities/user.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('LessonNotesService', () => {
  let service: LessonNotesService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockEntityManager = {
    find: jest.fn(),
  };

  const mockEmailService = {
    sendNotificationEmail: jest.fn(),
  };

  const mockTeacher = { id: 'teacher_1', role: 'teacher', email: 't@test.com' } as User;
  const mockAdmin = { id: 'admin_1', role: 'super administrator', email: 'a@test.com' } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonNotesService,
        { provide: getRepositoryToken(LessonNote), useValue: mockRepo },
        { provide: EntityManager, useValue: mockEntityManager },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<LessonNotesService>(LessonNotesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a draft lesson note', async () => {
      mockRepo.create.mockReturnValue({ id: 'note_1' });
      mockRepo.save.mockResolvedValue({ id: 'note_1' });

      const res = await service.create({ topic: 'T' } as any, mockTeacher, 'tenant_1');
      expect(res.id).toBe('note_1');
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ teacherId: 'teacher_1', status: 'draft' }));
    });
  });

  describe('findAll', () => {
    it('should query correctly for teacher', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 'note_1' }]);
      const res = await service.findAll({ subjectId: 'sub_1' }, mockTeacher, 'tenant_1');
      expect(res).toHaveLength(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('lessonNote.teacherId = :userId', { userId: 'teacher_1' });
    });

    it('should query correctly for admin', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 'note_1' }]);
      await service.findAll({ classId: 'cls_1' }, mockAdmin, 'tenant_1');
      // Should have Brackets condition for admin
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(expect.any(Object));
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('lessonNote.classId = :classId', { classId: 'cls_1' });
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('n_1', 'tenant_1')).rejects.toThrow(NotFoundException);
    });

    it('should return note if found', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ id: 'n_1' });
      const res = await service.findOne('n_1', 'tenant_1');
      expect(res.id).toBe('n_1');
    });
  });

  describe('update', () => {
    it('should throw if user is neither owner nor admin', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ id: 'n_1', teacherId: 'other', status: 'draft' });
      await expect(service.update('n_1', {}, mockTeacher, 'tenant_1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw if owner tries to edit approved note', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ id: 'n_1', teacherId: 'teacher_1', status: 'approved' });
      await expect(service.update('n_1', {}, mockTeacher, 'tenant_1')).rejects.toThrow(ForbiddenException);
    });

    it('should update if valid', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ id: 'n_1', teacherId: 'teacher_1', status: 'draft' });
      mockRepo.save.mockImplementation(e => e);
      const res = await service.update('n_1', { topic: 'New' } as any, mockTeacher, 'tenant_1');
      expect(res.topic).toBe('New');
    });
  });

  describe('delete', () => {
    it('should throw if not owner and not admin', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ id: 'n_1', teacherId: 'other' });
      await expect(service.delete('n_1', mockTeacher, 'tenant_1')).rejects.toThrow(ForbiddenException);
    });

    it('should delete if owner', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ id: 'n_1', teacherId: 'teacher_1' });
      mockRepo.remove.mockResolvedValueOnce(undefined);
      await service.delete('n_1', mockTeacher, 'tenant_1');
      expect(mockRepo.remove).toHaveBeenCalled();
    });
  });

  describe('submit', () => {
    it('should throw if not owner', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ id: 'n_1', teacherId: 'other' });
      await expect(service.submit('n_1', mockTeacher, 'tenant_1')).rejects.toThrow(ForbiddenException);
    });

    it('should submit and notify admins', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ id: 'n_1', teacherId: 'teacher_1', topic: 'T' });
      mockRepo.save.mockResolvedValueOnce({ id: 'n_1', topic: 'T', status: 'submitted' });
      mockEntityManager.find.mockResolvedValueOnce([mockAdmin]);

      const res = await service.submit('n_1', mockTeacher, 'tenant_1');
      expect(res.status).toBe('submitted');
      expect(mockEmailService.sendNotificationEmail).toHaveBeenCalledWith(mockAdmin.email, expect.any(String), expect.any(String), expect.any(String));
    });
  });

  describe('review', () => {
    it('should set review status and notes', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ id: 'n_1' });
      mockRepo.save.mockImplementation(e => e);
      const res = await service.review('n_1', 'approved', 'Good', mockAdmin, 'tenant_1');
      expect(res.status).toBe('approved');
      expect(res.reviewNotes).toBe('Good');
      expect(res.reviewerId).toBe('admin_1');
    });
  });

  describe('clone', () => {
    it('should clone note as draft', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ id: 'n_1', topic: 'T' });
      mockRepo.create.mockImplementation(e => e);
      mockRepo.save.mockImplementation(e => e);

      const res = await service.clone('n_1', mockTeacher, 'tenant_1');
      expect(res.status).toBe('draft');
      expect(res.teacherId).toBe('teacher_1');
    });
  });
});
