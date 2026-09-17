import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ScoreEntryService } from '../services/score-entry.service';
import { ExamResult } from '../entities/exam-result.entity';
import { StudentSkill } from '../entities/student-skill.entity';
import { StudentPsychomotor } from '../entities/student-psychomotor.entity';
import { AssessmentType } from '../entities/assessment-type.entity';
import { Exam } from '../entities/exam.entity';
import { Student } from '../../students/entities/student.entity';
import { SystemSettingsService } from '../../system/services/system-settings.service';
import { Raw } from 'typeorm';

describe('ScoreEntryService', () => {
  let service: ScoreEntryService;

  const createMockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  });

  const mockExamResultRepo = createMockRepository();
  const mockStudentSkillRepo = createMockRepository();
  const mockStudentPsychomotorRepo = createMockRepository();
  const mockAssessmentTypeRepo = createMockRepository();
  const mockExamRepo = createMockRepository();
  const mockStudentRepo = createMockRepository();

  const mockSystemSettingsService = {
    getActiveSessionId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoreEntryService,
        { provide: getRepositoryToken(ExamResult), useValue: mockExamResultRepo },
        { provide: getRepositoryToken(StudentSkill), useValue: mockStudentSkillRepo },
        { provide: getRepositoryToken(StudentPsychomotor), useValue: mockStudentPsychomotorRepo },
        { provide: getRepositoryToken(AssessmentType), useValue: mockAssessmentTypeRepo },
        { provide: getRepositoryToken(Exam), useValue: mockExamRepo },
        { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
        { provide: SystemSettingsService, useValue: mockSystemSettingsService },
      ],
    }).compile();

    service = module.get<ScoreEntryService>(ScoreEntryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Marks Entry', () => {
    it('should save marks successfully (new records)', async () => {
      mockSystemSettingsService.getActiveSessionId.mockResolvedValueOnce('session_1');
      mockExamRepo.findOne.mockResolvedValueOnce({ id: 'ex_1', classId: 'cls_1', subjectId: 'sub_1' });
      mockAssessmentTypeRepo.findOne.mockResolvedValueOnce({ id: 'at_1', maxMarks: 100 });
      mockExamResultRepo.find.mockResolvedValueOnce([]); // no existing results

      mockExamResultRepo.create.mockReturnValue({ studentId: 'st_1' });
      mockExamResultRepo.save.mockResolvedValueOnce([{ studentId: 'st_1', score: 85 }]);

      const res = await service.saveMarks({
        examId: 'ex_1',
        assessmentTypeId: 'at_1',
        marks: [{ studentId: 'st_1', score: 85 }]
      }, 'tenant_1');

      expect(res).toHaveLength(1);
      expect(mockExamResultRepo.create).toHaveBeenCalled();
    });

    it('should throw error if score exceeds maxMarks', async () => {
      mockSystemSettingsService.getActiveSessionId.mockResolvedValueOnce('session_1');
      mockExamRepo.findOne.mockResolvedValueOnce({ id: 'ex_1' });
      mockAssessmentTypeRepo.findOne.mockResolvedValueOnce({ id: 'at_1', maxMarks: 50, name: 'Test' });
      mockExamResultRepo.find.mockResolvedValueOnce([]);

      await expect(service.saveMarks({
        examId: 'ex_1',
        assessmentTypeId: 'at_1',
        marks: [{ studentId: 'st_1', score: 85 }] // > 50
      }, 'tenant_1')).rejects.toThrow(/exceeds maximum allowed marks/);
    });

    it('should get marks', async () => {
      mockSystemSettingsService.getActiveSessionId.mockResolvedValueOnce('session_1');
      mockExamResultRepo.find.mockResolvedValueOnce([{ id: 'res_1' }]);
      const res = await service.getMarks('ex_1', 'tenant_1', 'at_1');
      expect(res).toHaveLength(1);
    });

    it('should get class marks', async () => {
      mockSystemSettingsService.getActiveSessionId.mockResolvedValueOnce('session_1');
      mockExamResultRepo.find.mockResolvedValueOnce([{ id: 'res_1' }]);
      const res = await service.getClassMarks('cls_1', 'eg_1', 'tenant_1');
      expect(res).toHaveLength(1);
    });
  });

  describe('Skills Entry', () => {
    it('should save skills (new)', async () => {
      mockStudentSkillRepo.find.mockResolvedValueOnce([]);
      mockStudentSkillRepo.create.mockReturnValue({ studentId: 'st_1', domainId: 'dom_1' });
      mockStudentSkillRepo.save.mockResolvedValueOnce([{ rating: 5 }]);

      const res = await service.saveSkills({
        examGroupId: 'eg_1',
        skills: [{ studentId: 'st_1', domainId: 'dom_1', rating: '5' }]
      }, 'tenant_1');

      expect(res).toHaveLength(1);
    });

    it('should get skills', async () => {
      mockStudentSkillRepo.find.mockResolvedValueOnce([{ id: 'sk_1' }]);
      const res = await service.getSkills('eg_1', 'tenant_1');
      expect(res).toHaveLength(1);
    });
  });

  describe('Psychomotor Entry', () => {
    it('should save psychomotor ratings (update existing)', async () => {
      const existing = { studentId: 'st_1', domainId: 'dom_1', rating: '2' };
      mockStudentPsychomotorRepo.find.mockResolvedValueOnce([existing]);
      mockStudentPsychomotorRepo.save.mockResolvedValueOnce([existing]);

      const res = await service.savePsychomotor({
        examGroupId: 'eg_1',
        ratings: [{ studentId: 'st_1', domainId: 'dom_1', rating: '4' }]
      }, 'tenant_1');

      expect(mockStudentPsychomotorRepo.create).not.toHaveBeenCalled();
      expect(existing.rating).toBe('4');
    });

    it('should get psychomotor', async () => {
      mockStudentPsychomotorRepo.find.mockResolvedValueOnce([{ id: 'psy_1' }]);
      const res = await service.getPsychomotor('eg_1', 'tenant_1');
      expect(res).toHaveLength(1);
    });
  });

  describe('Bulk Import Methods', () => {
    it('should validate bulk marks - valid', async () => {
      mockStudentRepo.find.mockResolvedValueOnce([{ id: 'st_1', admissionNo: 'ADM001', firstName: 'John', lastName: 'Doe' }]);
      mockAssessmentTypeRepo.findOne.mockResolvedValueOnce({ id: 'at_1', maxMarks: 100 });

      const res = await service.validateBulkMarks([{ 'AdmissionNo': 'ADM001', 'score': 80 }], 'tenant_1', 'ex_1', 'at_1');
      expect(res[0].validationStatus).toBe('Valid');
      expect(res[0].studentId).toBe('st_1');
    });

    it('should validate bulk marks - invalid student and score', async () => {
      mockStudentRepo.find.mockResolvedValueOnce([]); // no students
      mockAssessmentTypeRepo.findOne.mockResolvedValueOnce({ id: 'at_1', maxMarks: 50 });

      const res = await service.validateBulkMarks([{ 'AdmissionNo': 'ADM001', 'score': 60 }], 'tenant_1', 'ex_1', 'at_1');
      expect(res[0].validationStatus).toBe('Invalid');
      expect(res[0].errors).toContain('Student with admission number "adm001" not found.');
      expect(res[0].errors).toContain('Score 60 exceeds maximum 50 for undefined.');
    });

    it('should save single batch mark - success', async () => {
      mockSystemSettingsService.getActiveSessionId.mockResolvedValueOnce('session_1');
      mockStudentRepo.findOne.mockResolvedValueOnce({ id: 'st_1' });
      mockExamRepo.findOne.mockResolvedValueOnce({ id: 'ex_1', classId: 'cls_1' });
      mockExamResultRepo.findOne.mockResolvedValueOnce(null); // not found
      mockExamResultRepo.create.mockReturnValue({ studentId: 'st_1' });
      mockAssessmentTypeRepo.findOne.mockResolvedValueOnce({ maxMarks: 100 });
      mockExamResultRepo.save.mockResolvedValueOnce({ score: 90 });

      const res = await service.saveSingleBatchMark({
        admissionNo: 'ADM001', examId: 'ex_1', assessmentTypeId: 'at_1', score: 90, tenantId: 'tenant_1'
      });

      expect(mockExamResultRepo.create).toHaveBeenCalled();
      expect(mockExamResultRepo.save).toHaveBeenCalled();
    });

    it('should save single batch mark - keep PRESENT if incoming is ABSENT', async () => {
      mockSystemSettingsService.getActiveSessionId.mockResolvedValueOnce('session_1');
      mockStudentRepo.findOne.mockResolvedValueOnce({ id: 'st_1' });
      mockExamRepo.findOne.mockResolvedValueOnce({ id: 'ex_1' });
      const existingResult = { status: 'PRESENT', score: 80 };
      mockExamResultRepo.findOne.mockResolvedValueOnce(existingResult);

      const res = await service.saveSingleBatchMark({
        admissionNo: 'ADM001', examId: 'ex_1', score: 0, tenantId: 'tenant_1', status: 'ABSENT'
      });

      expect(res).toEqual(existingResult);
      expect(mockExamResultRepo.save).not.toHaveBeenCalled();
    });
  });
});
