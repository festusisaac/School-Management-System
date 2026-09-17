import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExamSetupService } from '../services/exam-setup.service';
import { ExamGroup } from '../entities/exam-group.entity';
import { AssessmentType } from '../entities/assessment-type.entity';
import { GradeScale } from '../entities/grade-scale.entity';
import { Exam } from '../entities/exam.entity';
import { ExamSchedule } from '../entities/exam-schedule.entity';
import { AdmitCard } from '../entities/admit-card.entity';
import { PsychomotorDomain } from '../entities/psychomotor-domain.entity';
import { AffectiveDomain } from '../entities/affective-domain.entity';
import { SystemSettingsService } from '../../system/services/system-settings.service';

describe('ExamSetupService', () => {
  let service: ExamSetupService;

  const createMockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  });

  const mockExamGroupRepo = createMockRepository();
  const mockAssessmentTypeRepo = createMockRepository();
  const mockGradeScaleRepo = createMockRepository();
  const mockExamRepo = createMockRepository();
  const mockExamScheduleRepo = createMockRepository();
  const mockAdmitCardRepo = createMockRepository();
  const mockPsychomotorRepo = createMockRepository();
  const mockAffectiveRepo = createMockRepository();

  const mockSystemSettingsService = {
    getActiveSessionId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamSetupService,
        { provide: getRepositoryToken(ExamGroup), useValue: mockExamGroupRepo },
        { provide: getRepositoryToken(AssessmentType), useValue: mockAssessmentTypeRepo },
        { provide: getRepositoryToken(GradeScale), useValue: mockGradeScaleRepo },
        { provide: getRepositoryToken(Exam), useValue: mockExamRepo },
        { provide: getRepositoryToken(ExamSchedule), useValue: mockExamScheduleRepo },
        { provide: getRepositoryToken(AdmitCard), useValue: mockAdmitCardRepo },
        { provide: getRepositoryToken(PsychomotorDomain), useValue: mockPsychomotorRepo },
        { provide: getRepositoryToken(AffectiveDomain), useValue: mockAffectiveRepo },
        { provide: SystemSettingsService, useValue: mockSystemSettingsService },
      ],
    }).compile();

    service = module.get<ExamSetupService>(ExamSetupService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Exam Groups', () => {
    it('should create an exam group', async () => {
      mockSystemSettingsService.getActiveSessionId.mockResolvedValueOnce('session_1');
      mockExamGroupRepo.create.mockReturnValueOnce({ name: 'Group 1' });
      mockExamGroupRepo.save.mockResolvedValueOnce({ id: 'eg_1', name: 'Group 1' });

      const res = await service.createExamGroup({ name: 'Group 1' } as any, 'tenant_1');
      expect(res.id).toBe('eg_1');
      expect(mockExamGroupRepo.create).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'session_1' }));
    });

    it('should find all exam groups', async () => {
      mockSystemSettingsService.getActiveSessionId.mockResolvedValueOnce('session_1');
      mockExamGroupRepo.find.mockResolvedValueOnce([{ id: 'eg_1' }]);

      const res = await service.findAllExamGroups('tenant_1');
      expect(res).toHaveLength(1);
    });

    it('should find one exam group', async () => {
      mockExamGroupRepo.findOne.mockResolvedValueOnce({ id: 'eg_1' });
      const res = await service.findOneExamGroup('eg_1', 'tenant_1');
      expect(res!.id).toBe('eg_1');
    });

    it('should update an exam group', async () => {
      mockExamGroupRepo.update.mockResolvedValueOnce({});
      mockExamGroupRepo.findOne.mockResolvedValueOnce({ id: 'eg_1', name: 'Updated' });
      const res = await service.updateExamGroup('eg_1', { name: 'Updated' }, 'tenant_1');
      expect(res!.name).toBe('Updated');
    });

    it('should delete an exam group', async () => {
      mockExamGroupRepo.delete.mockResolvedValueOnce({});
      await service.deleteExamGroup('eg_1', 'tenant_1');
      expect(mockExamGroupRepo.delete).toHaveBeenCalledWith({ id: 'eg_1', tenantId: 'tenant_1' });
    });
  });

  describe('Assessment Types', () => {
    it('should create an assessment type', async () => {
      mockAssessmentTypeRepo.create.mockReturnValueOnce({ name: 'CA1' });
      mockAssessmentTypeRepo.save.mockResolvedValueOnce({ id: 'at_1' });
      const res = await service.createAssessmentType({ name: 'CA1' } as any, 'tenant_1');
      expect(res.id).toBe('at_1');
    });

    it('should get assessment types', async () => {
      mockAssessmentTypeRepo.find.mockResolvedValueOnce([{ id: 'at_1' }]);
      const res = await service.getAssessmentTypes('eg_1', 'tenant_1');
      expect(res).toHaveLength(1);
    });

    it('should update an assessment type', async () => {
      mockAssessmentTypeRepo.update.mockResolvedValueOnce({});
      mockAssessmentTypeRepo.findOne.mockResolvedValueOnce({ id: 'at_1' });
      await service.updateAssessmentType('at_1', { name: 'Updated' }, 'tenant_1');
      expect(mockAssessmentTypeRepo.update).toHaveBeenCalled();
    });

    it('should delete an assessment type', async () => {
      mockAssessmentTypeRepo.delete.mockResolvedValueOnce({});
      await service.deleteAssessmentType('at_1', 'tenant_1');
      expect(mockAssessmentTypeRepo.delete).toHaveBeenCalled();
    });
  });

  describe('Grade Scales', () => {
    it('should create a grade scale', async () => {
      mockGradeScaleRepo.create.mockReturnValueOnce({ name: 'A' });
      mockGradeScaleRepo.save.mockResolvedValueOnce({ id: 'gs_1' });
      const res = await service.createGradeScale({ name: 'A' } as any, 'tenant_1');
      expect(res.id).toBe('gs_1');
    });

    it('should get grade scales', async () => {
      mockGradeScaleRepo.find.mockResolvedValueOnce([{ id: 'gs_1' }]);
      const res = await service.getGradeScales('tenant_1');
      expect(res).toHaveLength(1);
    });

    it('should update a grade scale', async () => {
      mockGradeScaleRepo.update.mockResolvedValueOnce({});
      mockGradeScaleRepo.findOne.mockResolvedValueOnce({ id: 'gs_1' });
      await service.updateGradeScale('gs_1', { name: 'Updated' }, 'tenant_1');
      expect(mockGradeScaleRepo.update).toHaveBeenCalled();
    });

    it('should delete a grade scale', async () => {
      mockGradeScaleRepo.delete.mockResolvedValueOnce({});
      await service.deleteGradeScale('gs_1', 'tenant_1');
      expect(mockGradeScaleRepo.delete).toHaveBeenCalled();
    });
  });

  describe('Exams', () => {
    it('should create an exam', async () => {
      mockSystemSettingsService.getActiveSessionId.mockResolvedValueOnce('session_1');
      mockExamRepo.create.mockReturnValueOnce({ subjectId: 'subj_1' });
      mockExamRepo.save.mockResolvedValueOnce({ id: 'ex_1' });
      const res = await service.createExam({ subjectId: 'subj_1' } as any, 'tenant_1');
      expect(res.id).toBe('ex_1');
    });

    it('should get exams', async () => {
      mockSystemSettingsService.getActiveSessionId.mockResolvedValueOnce('session_1');
      mockExamRepo.find.mockResolvedValueOnce([{ id: 'ex_1' }]);
      const res = await service.getExams('eg_1', 'tenant_1');
      expect(res).toHaveLength(1);
    });

    it('should update an exam', async () => {
      mockExamRepo.update.mockResolvedValueOnce({});
      mockExamRepo.findOne.mockResolvedValueOnce({ id: 'ex_1' });
      await service.updateExam('ex_1', {}, 'tenant_1');
      expect(mockExamRepo.update).toHaveBeenCalled();
    });

    it('should delete an exam', async () => {
      mockExamRepo.delete.mockResolvedValueOnce({});
      await service.deleteExam('ex_1', 'tenant_1');
      expect(mockExamRepo.delete).toHaveBeenCalled();
    });
  });

  describe('Schedules', () => {
    it('should schedule an exam', async () => {
      mockExamScheduleRepo.create.mockReturnValueOnce({ date: '2023-10-10' });
      mockExamScheduleRepo.save.mockResolvedValueOnce({ id: 'sch_1' });
      const res = await service.scheduleExam({ date: '2023-10-10' } as any, 'tenant_1');
      expect(res.id).toBe('sch_1');
    });

    it('should get schedule', async () => {
      mockExamScheduleRepo.find.mockResolvedValueOnce([{ id: 'sch_1' }]);
      const res = await service.getSchedule('eg_1', 'tenant_1');
      expect(res).toHaveLength(1);
    });

    it('should get schedule for class', async () => {
      mockExamScheduleRepo.find.mockResolvedValueOnce([{ id: 'sch_1' }]);
      const res = await service.getScheduleForClass('class_1', 'tenant_1');
      expect(res).toHaveLength(1);
    });

    it('should get exams for class', async () => {
      mockSystemSettingsService.getActiveSessionId.mockResolvedValueOnce('session_1');
      mockExamRepo.find.mockResolvedValueOnce([{ id: 'ex_1' }]);
      const res = await service.getExamsForClass('class_1', 'tenant_1');
      expect(res).toHaveLength(1);
    });

    it('should update schedule', async () => {
      mockExamScheduleRepo.update.mockResolvedValueOnce({});
      mockExamScheduleRepo.findOne.mockResolvedValueOnce({ id: 'sch_1' });
      await service.updateSchedule('sch_1', {}, 'tenant_1');
      expect(mockExamScheduleRepo.update).toHaveBeenCalled();
    });

    it('should delete schedule', async () => {
      mockExamScheduleRepo.delete.mockResolvedValueOnce({});
      await service.deleteSchedule('sch_1', 'tenant_1');
      expect(mockExamScheduleRepo.delete).toHaveBeenCalled();
    });
  });

  describe('Admit Cards', () => {
    it('should create template', async () => {
      mockAdmitCardRepo.create.mockReturnValueOnce({ name: 'Template 1' });
      mockAdmitCardRepo.save.mockResolvedValueOnce({ id: 'ac_1' });
      const res = await service.createAdmitCardTemplate({ name: 'Template 1' }, 'tenant_1');
      expect((res as any).id).toBe('ac_1');
    });

    it('should get templates', async () => {
      mockAdmitCardRepo.find.mockResolvedValueOnce([{ id: 'ac_1' }]);
      const res = await service.getAdmitCardTemplates('eg_1', 'tenant_1');
      expect(res).toHaveLength(1);
    });

    it('should update template', async () => {
      mockAdmitCardRepo.update.mockResolvedValueOnce({});
      mockAdmitCardRepo.findOne.mockResolvedValueOnce({ id: 'ac_1' });
      await service.updateAdmitCardTemplate('ac_1', {}, 'tenant_1');
      expect(mockAdmitCardRepo.update).toHaveBeenCalled();
    });

    it('should delete template', async () => {
      mockAdmitCardRepo.delete.mockResolvedValueOnce({});
      await service.deleteAdmitCardTemplate('ac_1', 'tenant_1');
      expect(mockAdmitCardRepo.delete).toHaveBeenCalled();
    });

    it('should get batch data', async () => {
      mockExamScheduleRepo.find.mockResolvedValueOnce([{ id: 'sch_1' }]);
      mockExamGroupRepo.findOne.mockResolvedValueOnce({ id: 'eg_1' });
      const res = await service.getAdmitCardBatchData('eg_1', 'tenant_1');
      expect(res.schedules).toHaveLength(1);
      expect(res.group!.id).toBe('eg_1');
    });
  });

  describe('Domains', () => {
    it('should create psychomotor domain', async () => {
      mockPsychomotorRepo.create.mockReturnValueOnce({ name: 'Handwriting' });
      mockPsychomotorRepo.save.mockResolvedValueOnce({ id: 'pd_1' });
      const res = await service.createPsychomotorDomain('Handwriting', 'tenant_1');
      expect(res.id).toBe('pd_1');
    });

    it('should get psychomotor domains', async () => {
      mockPsychomotorRepo.find.mockResolvedValueOnce([{ id: 'pd_1' }]);
      const res = await service.getPsychomotorDomains('tenant_1');
      expect(res).toHaveLength(1);
    });

    it('should update psychomotor domain', async () => {
      mockPsychomotorRepo.update.mockResolvedValueOnce({});
      mockPsychomotorRepo.findOne.mockResolvedValueOnce({ id: 'pd_1' });
      await service.updatePsychomotorDomain('pd_1', 'Updated', 'tenant_1');
      expect(mockPsychomotorRepo.update).toHaveBeenCalled();
    });

    it('should delete psychomotor domain', async () => {
      mockPsychomotorRepo.delete.mockResolvedValueOnce({});
      await service.deletePsychomotorDomain('pd_1', 'tenant_1');
      expect(mockPsychomotorRepo.delete).toHaveBeenCalled();
    });

    it('should create affective domain', async () => {
      mockAffectiveRepo.create.mockReturnValueOnce({ name: 'Punctuality' });
      mockAffectiveRepo.save.mockResolvedValueOnce({ id: 'ad_1' });
      const res = await service.createAffectiveDomain('Punctuality', 'tenant_1');
      expect(res.id).toBe('ad_1');
    });

    it('should get affective domains', async () => {
      mockAffectiveRepo.find.mockResolvedValueOnce([{ id: 'ad_1' }]);
      const res = await service.getAffectiveDomains('tenant_1');
      expect(res).toHaveLength(1);
    });

    it('should update affective domain', async () => {
      mockAffectiveRepo.update.mockResolvedValueOnce({});
      mockAffectiveRepo.findOne.mockResolvedValueOnce({ id: 'ad_1' });
      await service.updateAffectiveDomain('ad_1', 'Updated', 'tenant_1');
      expect(mockAffectiveRepo.update).toHaveBeenCalled();
    });

    it('should delete affective domain', async () => {
      mockAffectiveRepo.delete.mockResolvedValueOnce({});
      await service.deleteAffectiveDomain('ad_1', 'tenant_1');
      expect(mockAffectiveRepo.delete).toHaveBeenCalled();
    });
  });

  describe('replicateGradeScalesForNewSession', () => {
    it('should copy old grade scales to new session', async () => {
      mockGradeScaleRepo.find.mockResolvedValueOnce([{ name: 'A', grades: [] }]);
      mockGradeScaleRepo.findOne.mockResolvedValueOnce(null); // not existing
      mockGradeScaleRepo.create.mockReturnValueOnce({ id: 'new_gs_1' });
      mockGradeScaleRepo.save.mockResolvedValueOnce({ id: 'new_gs_1' });

      await service.replicateGradeScalesForNewSession('old_session', 'new_session', 'tenant_1');
      
      expect(mockGradeScaleRepo.find).toHaveBeenCalled();
      expect(mockGradeScaleRepo.create).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'new_session' }));
      expect(mockGradeScaleRepo.save).toHaveBeenCalled();
    });

    it('should skip if grade scale already exists in new session', async () => {
      mockGradeScaleRepo.find.mockResolvedValueOnce([{ name: 'A', grades: [] }]);
      mockGradeScaleRepo.findOne.mockResolvedValueOnce({ id: 'existing' });

      await service.replicateGradeScalesForNewSession('old_session', 'new_session', 'tenant_1');
      
      expect(mockGradeScaleRepo.create).not.toHaveBeenCalled();
      expect(mockGradeScaleRepo.save).not.toHaveBeenCalled();
    });
  });
});
