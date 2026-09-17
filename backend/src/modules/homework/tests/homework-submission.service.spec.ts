import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HomeworkSubmissionService } from '../services/homework-submission.service';
import { HomeworkSubmission, SubmissionStatus } from '../entities/submission.entity';
import { Homework } from '../entities/homework.entity';
import { Student } from '../../students/entities/student.entity';
import { NotFoundException } from '@nestjs/common';

describe('HomeworkSubmissionService', () => {
  let service: HomeworkSubmissionService;

  const mockSubmissionRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockHomeworkRepo = {
    findOne: jest.fn(),
  };

  const mockStudentRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeworkSubmissionService,
        { provide: getRepositoryToken(HomeworkSubmission), useValue: mockSubmissionRepo },
        { provide: getRepositoryToken(Homework), useValue: mockHomeworkRepo },
        { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
      ],
    }).compile();

    service = module.get<HomeworkSubmissionService>(HomeworkSubmissionService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveStudentId', () => {
    it('should throw if student not found', async () => {
      mockStudentRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.resolveStudentId('u_1', 'tenant_1')).rejects.toThrow(NotFoundException);
    });

    it('should return student id if found', async () => {
      mockStudentRepo.findOne.mockResolvedValueOnce({ id: 'st_1' });
      const res = await service.resolveStudentId('u_1', 'tenant_1');
      expect(res).toBe('st_1');
    });
  });

  describe('submit', () => {
    it('should throw if homework not found', async () => {
      mockStudentRepo.findOne.mockResolvedValueOnce({ id: 'st_1' });
      mockHomeworkRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.submit({ homeworkId: 'hw_1' } as any, 'st_1', 'tenant_1')).rejects.toThrow(NotFoundException);
    });

    it('should create new submission', async () => {
      mockStudentRepo.findOne.mockResolvedValueOnce({ id: 'st_1' });
      mockHomeworkRepo.findOne.mockResolvedValueOnce({ id: 'hw_1' });
      mockSubmissionRepo.findOne.mockResolvedValueOnce(null);
      mockSubmissionRepo.create.mockReturnValue({ id: 'sub_1' });
      mockSubmissionRepo.save.mockResolvedValue({ id: 'sub_1' });

      const res = await service.submit({ homeworkId: 'hw_1' } as any, 'st_1', 'tenant_1');
      expect(res.id).toBe('sub_1');
      expect(mockSubmissionRepo.create).toHaveBeenCalledWith(expect.objectContaining({ status: SubmissionStatus.SUBMITTED }));
    });

    it('should update existing submission', async () => {
      mockStudentRepo.findOne.mockResolvedValueOnce({ id: 'st_1' });
      mockHomeworkRepo.findOne.mockResolvedValueOnce({ id: 'hw_1' });
      mockSubmissionRepo.findOne.mockResolvedValueOnce({ id: 'sub_1', content: 'Old' });
      mockSubmissionRepo.save.mockImplementation(e => e);

      const res = await service.submit({ homeworkId: 'hw_1', content: 'New' } as any, 'st_1', 'tenant_1');
      expect(res.content).toBe('New');
    });
  });

  describe('findByHomework', () => {
    it('should return submissions', async () => {
      mockSubmissionRepo.find.mockResolvedValueOnce([{ id: 'sub_1' }]);
      const res = await service.findByHomework('hw_1', 'tenant_1');
      expect(res).toHaveLength(1);
    });
  });

  describe('findByStudent', () => {
    it('should return submissions', async () => {
      mockSubmissionRepo.find.mockResolvedValueOnce([{ id: 'sub_1' }]);
      const res = await service.findByStudent('st_1', 'tenant_1');
      expect(res).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      mockSubmissionRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('sub_1', 'tenant_1')).rejects.toThrow(NotFoundException);
    });

    it('should return submission', async () => {
      mockSubmissionRepo.findOne.mockResolvedValueOnce({ id: 'sub_1' });
      const res = await service.findOne('sub_1', 'tenant_1');
      expect(res.id).toBe('sub_1');
    });
  });

  describe('grade', () => {
    it('should grade submission', async () => {
      mockSubmissionRepo.findOne.mockResolvedValueOnce({ id: 'sub_1' });
      mockSubmissionRepo.save.mockImplementation(e => e);

      const res = await service.grade('sub_1', { grade: 'A', feedback: 'Good' }, 'tenant_1');
      expect(res.grade).toBe('A');
      expect(res.feedback).toBe('Good');
      expect(res.status).toBe(SubmissionStatus.GRADED);
    });
  });
});
