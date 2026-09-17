import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ResultProcessingService } from '../services/result-processing.service';
import { ExamResult } from '../entities/exam-result.entity';
import { StudentTermResult } from '../entities/student-term-result.entity';
import { GradeScale } from '../entities/grade-scale.entity';
import { Exam } from '../entities/exam.entity';
import { StudentAttendance } from '../../students/entities/student-attendance.entity';
import { SystemSettingsService } from '../../system/services/system-settings.service';
import { getQueueToken } from '@nestjs/bull';
import { ExamGroup } from '../entities/exam-group.entity';
import { AcademicTerm } from '../../system/entities/academic-term.entity';

describe('ResultProcessingService', () => {
  let service: ResultProcessingService;

  const mockQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  const createMockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    manager: {
      getRepository: jest.fn(),
    }
  });

  const mockExamResultRepo = createMockRepository();
  const mockTermResultRepo = createMockRepository();
  const mockGradeScaleRepo = createMockRepository();
  const mockExamRepo = createMockRepository();
  const mockAttendanceRepo = createMockRepository();

  const mockSystemSettingsService = {
    getActiveSessionId: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  const mockGenericRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    // Setup nested getRepository mock
    mockExamResultRepo.manager.getRepository.mockImplementation((entity: any) => mockGenericRepo);
    mockExamRepo.manager.getRepository.mockImplementation((entity: any) => mockGenericRepo);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultProcessingService,
        { provide: getRepositoryToken(ExamResult), useValue: mockExamResultRepo },
        { provide: getRepositoryToken(StudentTermResult), useValue: mockTermResultRepo },
        { provide: getRepositoryToken(GradeScale), useValue: mockGradeScaleRepo },
        { provide: getRepositoryToken(Exam), useValue: mockExamRepo },
        { provide: getRepositoryToken(StudentAttendance), useValue: mockAttendanceRepo },
        { provide: SystemSettingsService, useValue: mockSystemSettingsService },
        { provide: getQueueToken('result-processing'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<ResultProcessingService>(ResultProcessingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processResults', () => {
    it('should enqueue processing job', async () => {
      mockQueue.add.mockResolvedValueOnce({});
      const res = await service.processResults({ examGroupId: 'eg_1', classId: 'cls_1' }, 'tenant_1');
      expect(res.message).toContain('queued');
      expect(mockQueue.add).toHaveBeenCalledWith('process-class-results', expect.any(Object));
    });
  });

  describe('bulkPublishResults', () => {
    it('should bulk publish results', async () => {
      mockSystemSettingsService.getActiveSessionId.mockResolvedValueOnce('session_1');
      mockTermResultRepo.update.mockResolvedValueOnce({});

      const res = await service.bulkPublishResults({ examGroupId: 'eg_1', classId: 'cls_1', status: 'PUBLISHED' }, 'tenant_1');
      expect(res.message).toContain('published');
      expect(mockTermResultRepo.update).toHaveBeenCalled();
    });
  });

  describe('getBroadsheet', () => {
    it('should return broadsheet data successfully', async () => {
      mockSystemSettingsService.getActiveSessionId.mockResolvedValueOnce('session_1');
      mockGenericRepo.find.mockResolvedValueOnce([{ id: 'st_1', firstName: 'John' }]); // allStudents
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([ // subjectScoresRaw
          { studentId: 'st_1', subjectId: 'subj_1', totalSubjectScore: '85' }
        ])
        .mockResolvedValueOnce([ // attendanceDates
          { date: '2023-10-01' }
        ])
        .mockResolvedValueOnce([ // presenceResults
          { studentId: 'st_1', count: '1' }
        ]);

      mockGradeScaleRepo.findOne.mockResolvedValueOnce({ grades: [{ minScore: 0, maxScore: 100, name: 'A', remark: 'Good' }] });
      mockTermResultRepo.find.mockResolvedValueOnce([{ studentId: 'st_1', status: 'PUBLISHED' }]); // savedResults

      // ExamGroup
      mockGenericRepo.findOne.mockResolvedValueOnce({ id: 'eg_1', term: 'First Term', startDate: '2023-01-01', endDate: '2023-04-01' }); 
      // AcademicTerm
      mockGenericRepo.findOne.mockResolvedValueOnce({ daysOpened: 90 }); 

      const res = await service.getBroadsheet('eg_1', 'cls_1', 'tenant_1');

      expect(res.results).toHaveLength(1);
      expect(res.results[0].totalScore).toBe(85);
      expect(res.results[0].status).toBe('PUBLISHED');
      expect(res.subjectStats).toHaveLength(1);
      expect(res.subjectScores).toHaveLength(1);
    });
  });

  describe('getStudentReportCardData', () => {
    it('should return report card data successfully', async () => {
      mockSystemSettingsService.getActiveSessionId.mockResolvedValueOnce('session_1');

      // ExamGroup
      mockGenericRepo.findOne
        .mockResolvedValueOnce({ id: 'eg_1', term: 'First Term', startDate: '2023-01-01', endDate: '2023-04-01', classId: 'cls_1' })
        // AcademicTerm
        .mockResolvedValueOnce({ daysOpened: 90 }); 

      mockTermResultRepo.findOne.mockResolvedValueOnce({ studentId: 'st_1', classId: 'cls_1' }); // summary
      
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([{ date: '2023-10-01' }]) // attendanceDates
        .mockResolvedValueOnce([{ subjectId: 'subj_1', totalSubjectScore: '85' }]) // subjectScoresRaw
        .mockResolvedValueOnce([{ studentId: 'st_1', subjectId: 'subj_1', totalSubjectScore: '85' }]); // classSubjectScoresRaw

      mockAttendanceRepo.count.mockResolvedValueOnce(50); // daysPresent
      mockExamRepo.find.mockResolvedValueOnce([{ subjectId: 'subj_1', highestScore: 90, lowestScore: 50, averageScore: 70 }]);
      mockGradeScaleRepo.findOne.mockResolvedValueOnce({ grades: [{ minScore: 0, maxScore: 100, name: 'A', remark: 'Good' }] });

      const res = await service.getStudentReportCardData('st_1', 'eg_1', 'tenant_1');

      expect(res).toBeDefined();
      expect(res!.summary).toBeDefined();
      expect(res!.subjectScores).toHaveLength(1);
      expect(res!.subjectScores[0].grade).toBe('A');
      expect(res!.subjectStats).toHaveLength(1);
    });

    it('should return null if summary not found', async () => {
      mockSystemSettingsService.getActiveSessionId.mockResolvedValueOnce('session_1');
      mockGenericRepo.findOne.mockResolvedValueOnce({});
      mockTermResultRepo.findOne.mockResolvedValueOnce(null);

      const res = await service.getStudentReportCardData('st_1', 'eg_1', 'tenant_1');
      expect(res).toBeNull();
    });
  });
});
