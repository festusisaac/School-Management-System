import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TranscriptService } from '../services/transcript.service';
import { ExamResult } from '../entities/exam-result.entity';
import { StudentTermResult } from '../entities/student-term-result.entity';
import { Student } from '../../students/entities/student.entity';
import { GradeScale } from '../entities/grade-scale.entity';
import { NotFoundException } from '@nestjs/common';

describe('TranscriptService', () => {
  let service: TranscriptService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const createMockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  });

  const mockExamResultRepo = createMockRepository();
  const mockTermResultRepo = createMockRepository();
  const mockStudentRepo = createMockRepository();
  const mockGradeScaleRepo = createMockRepository();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranscriptService,
        { provide: getRepositoryToken(ExamResult), useValue: mockExamResultRepo },
        { provide: getRepositoryToken(StudentTermResult), useValue: mockTermResultRepo },
        { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
        { provide: getRepositoryToken(GradeScale), useValue: mockGradeScaleRepo },
      ],
    }).compile();

    service = module.get<TranscriptService>(TranscriptService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStudentTranscript', () => {
    it('should throw NotFoundException if student not found', async () => {
      mockStudentRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.getStudentTranscript('invalid', 'tenant_1')).rejects.toThrow(NotFoundException);
    });

    it('should return transcript successfully', async () => {
      mockStudentRepo.findOne.mockResolvedValueOnce({ id: 'st_1', firstName: 'John' });
      
      mockTermResultRepo.find.mockResolvedValueOnce([
        { examGroupId: 'term_1', totalScore: 85, averageScore: 85, status: 'PUBLISHED' }
      ]);
      
      mockQueryBuilder.getMany.mockResolvedValueOnce([
        {
          sessionId: 'sess_1',
          session: { name: '2023/2024' },
          exam: {
            examGroupId: 'term_1',
            examGroup: { term: 'First Term' },
            subjectId: 'subj_1',
            subject: { name: 'Math' }
          },
          score: 85
        }
      ]);

      mockGradeScaleRepo.findOne.mockResolvedValueOnce({
        grades: [{ minScore: 0, maxScore: 100, name: 'A', remark: 'Excellent' }]
      });

      const res = await service.getStudentTranscript('st_1', 'tenant_1');

      expect(res.student.firstName).toBe('John');
      expect(res.transcript).toHaveLength(1);
      expect(res.transcript[0].terms).toHaveLength(1);
      expect(res.transcript[0].terms[0].subjects).toHaveLength(1);
      expect(res.transcript[0].terms[0].subjects[0].grade).toBe('A');
    });

    it('should calculate missing summary if not found', async () => {
      mockStudentRepo.findOne.mockResolvedValueOnce({ id: 'st_1', firstName: 'John' });
      
      mockTermResultRepo.find.mockResolvedValueOnce([]); // No summary
      
      mockQueryBuilder.getMany.mockResolvedValueOnce([
        {
          sessionId: 'sess_1',
          session: { name: '2023/2024' },
          exam: {
            examGroupId: 'term_1',
            examGroup: { term: 'First Term' },
            subjectId: 'subj_1',
            subject: { name: 'Math' }
          },
          score: 85
        }
      ]);

      mockGradeScaleRepo.findOne.mockResolvedValueOnce(null); // No grade scale

      const res = await service.getStudentTranscript('st_1', 'tenant_1');

      expect(res.transcript[0].terms[0].summary.averageScore).toBe(85);
      expect(res.transcript[0].terms[0].summary.totalScore).toBe(85);
    });

    it('should handle missing relations in raw scores gracefully', async () => {
      mockStudentRepo.findOne.mockResolvedValueOnce({ id: 'st_1', firstName: 'John' });
      mockTermResultRepo.find.mockResolvedValueOnce([]);
      
      mockQueryBuilder.getMany.mockResolvedValueOnce([
        { score: 85 } // Missing sessionId, termId, subjectId
      ]);

      mockGradeScaleRepo.findOne.mockResolvedValueOnce(null);

      const res = await service.getStudentTranscript('st_1', 'tenant_1');

      expect(res.transcript).toHaveLength(0); // Should be ignored
    });
  });
});
