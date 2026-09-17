import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TimetableService } from '../services/timetable.service';
import { TimetablePeriod } from '../entities/timetable-period.entity';
import { Timetable } from '../entities/timetable.entity';
import { SubjectTeacher } from '../entities/subject-teacher.entity';
import { SystemSettingsService } from '../../system/services/system-settings.service';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { IsNull } from 'typeorm';

describe('TimetableService', () => {
  let service: TimetableService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  const mockPeriodRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockTimetableRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockSubjectTeacherRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockSystemSettingsService = {
    getActiveSessionId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimetableService,
        { provide: getRepositoryToken(TimetablePeriod), useValue: mockPeriodRepo },
        { provide: getRepositoryToken(Timetable), useValue: mockTimetableRepo },
        { provide: getRepositoryToken(SubjectTeacher), useValue: mockSubjectTeacherRepo },
        { provide: SystemSettingsService, useValue: mockSystemSettingsService },
      ],
    }).compile();

    service = module.get<TimetableService>(TimetableService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Periods', () => {
    it('createPeriod - success', async () => {
      mockPeriodRepo.find.mockResolvedValueOnce([]); // no overlap
      mockPeriodRepo.create.mockReturnValueOnce({ id: 'p1' });
      mockPeriodRepo.save.mockResolvedValueOnce({ id: 'p1' });
      const res = await service.createPeriod({ startTime: '08:00', endTime: '09:00', tenantId: 'tenant_1' });
      expect(res.id).toBe('p1');
    });

    it('createPeriod - conflict', async () => {
      mockPeriodRepo.find.mockResolvedValueOnce([{ startTime: '08:30', endTime: '09:30' }]);
      await expect(service.createPeriod({ startTime: '08:00', endTime: '09:00', tenantId: 'tenant_1' }))
        .rejects.toThrow(ConflictException);
    });

    it('getAllPeriods', async () => {
      mockPeriodRepo.find.mockResolvedValueOnce([{ id: 'p1' }]);
      const res = await service.getAllPeriods('tenant_1');
      expect(res).toHaveLength(1);
    });

    it('updatePeriod', async () => {
      mockPeriodRepo.findOne.mockResolvedValueOnce({ id: 'p1' });
      mockPeriodRepo.save.mockImplementationOnce(val => Promise.resolve(val));
      const res = await service.updatePeriod('p1', { name: 'Updated' });
      expect(res.name).toBe('Updated');
    });

    it('deletePeriod - success', async () => {
      mockPeriodRepo.findOne.mockResolvedValueOnce({ id: 'p1' });
      mockTimetableRepo.findOne.mockResolvedValueOnce(null); // not used
      await service.deletePeriod('p1');
      expect(mockPeriodRepo.remove).toHaveBeenCalled();
    });

    it('deletePeriod - fail if used', async () => {
      mockPeriodRepo.findOne.mockResolvedValueOnce({ id: 'p1' });
      mockTimetableRepo.findOne.mockResolvedValueOnce({ id: 't1' }); // used
      await expect(service.deletePeriod('p1')).rejects.toThrow(BadRequestException);
    });

    it('reorderPeriods', async () => {
      mockPeriodRepo.find.mockResolvedValueOnce([{ id: 'p1' }, { id: 'p2' }]);
      mockPeriodRepo.save.mockResolvedValue({});
      mockPeriodRepo.find.mockResolvedValueOnce([{ id: 'p2', periodOrder: 1 }, { id: 'p1', periodOrder: 2 }]);
      const res = await service.reorderPeriods('tenant_1', ['p2', 'p1']);
      expect(res).toHaveLength(2);
    });

    it('initializeDefaultPeriods', async () => {
      mockPeriodRepo.find.mockResolvedValueOnce([]); // none existing
      mockPeriodRepo.create.mockReturnValue({});
      mockPeriodRepo.save.mockResolvedValue({});
      const res = await service.initializeDefaultPeriods('tenant_1');
      expect(res).toHaveLength(14); // 14 default periods
    });
  });

  describe('Timetable Slots', () => {
    it('createTimetableSlot - success', async () => {
      mockTimetableRepo.findOne.mockResolvedValueOnce(null); // no exact slot conflict
      mockSubjectTeacherRepo.findOne.mockResolvedValueOnce({ teacherId: 't1' }); // auto-assign
      mockQueryBuilder.getOne.mockResolvedValueOnce(null); // no teacher conflict

      mockTimetableRepo.create.mockReturnValueOnce({ id: 't1' });
      mockTimetableRepo.save.mockResolvedValueOnce({ id: 't1' });

      const res = await service.createTimetableSlot({ classId: 'c1', dayOfWeek: 1, periodId: 'p1', subjectId: 's1' });
      expect(res.id).toBe('t1');
    });

    it('createTimetableSlot - class conflict', async () => {
      mockTimetableRepo.findOne.mockResolvedValueOnce({ id: 'existing' });
      await expect(service.createTimetableSlot({ classId: 'c1', dayOfWeek: 1, periodId: 'p1' }))
        .rejects.toThrow(ConflictException);
    });

    it('getTimetable', async () => {
      mockTimetableRepo.find.mockResolvedValueOnce([{ id: 't1' }]);
      const res = await service.getTimetable('c1', null, 'tenant_1');
      expect(res).toHaveLength(1);
    });

    it('getTeacherTimetable', async () => {
      mockTimetableRepo.find.mockResolvedValueOnce([{ id: 't1' }]);
      const res = await service.getTeacherTimetable('t1', 'tenant_1');
      expect(res).toHaveLength(1);
    });

    it('getTeacherTodayTimetable', async () => {
      mockTimetableRepo.find.mockResolvedValueOnce([
        { id: 't1', period: { startTime: '08:00', endTime: '09:00' }, subject: { name: 'Math' }, class: { name: 'JSS1' } }
      ]);
      const res = await service.getTeacherTodayTimetable('t1', 'tenant_1');
      expect(res).toHaveLength(1);
      expect(res[0].subjectName).toBe('Math');
    });

    it('updateTimetableSlot - success', async () => {
      mockTimetableRepo.findOne
        .mockResolvedValueOnce({ id: 't1', classId: 'c1', subjectId: 's1', tenantId: 'tenant_1', dayOfWeek: 1, periodId: 'p1' }) // getTimetableSlotById
        .mockResolvedValueOnce(null); // check class conflict
        
      mockSubjectTeacherRepo.findOne.mockResolvedValueOnce(null); // auto-resolve teacher (none)
      mockQueryBuilder.getOne.mockResolvedValueOnce(null); // check teacher conflict

      mockTimetableRepo.save.mockImplementationOnce(val => Promise.resolve(val));

      const res = await service.updateTimetableSlot('t1', { dayOfWeek: 2 });
      expect(res.dayOfWeek).toBe(2);
    });

    it('deleteTimetableSlot', async () => {
      mockTimetableRepo.findOne.mockResolvedValueOnce({ id: 't1' });
      await service.deleteTimetableSlot('t1');
      expect(mockTimetableRepo.remove).toHaveBeenCalled();
    });

    it('clearTimetable', async () => {
      await service.clearTimetable('c1', null, 'tenant_1');
      expect(mockTimetableRepo.delete).toHaveBeenCalledWith({ classId: 'c1', sectionId: IsNull(), tenantId: 'tenant_1' });
    });

    it('saveTimetableBulk', async () => {
      mockTimetableRepo.delete.mockResolvedValueOnce({}); // clear
      mockSubjectTeacherRepo.find.mockResolvedValueOnce([]); // prefetch
      mockQueryBuilder.getOne.mockResolvedValue(null); // no conflicts

      mockTimetableRepo.create.mockReturnValue({ id: 'new_t' });
      mockTimetableRepo.save.mockResolvedValue({});
      mockTimetableRepo.find.mockResolvedValueOnce([{ id: 'new_t' }]); // return

      const res = await service.saveTimetableBulk('c1', 's1', 'tenant_1', [
        { dayOfWeek: 1, periodId: 'p1', subjectId: 'subj1', teacherId: 't1' }
      ]);
      expect(res).toHaveLength(1);
    });

    it('copyTimetable', async () => {
      mockTimetableRepo.find
        .mockResolvedValueOnce([{ dayOfWeek: 1, periodId: 'p1', subjectId: 'sub1' }]) // get source
        .mockResolvedValueOnce([{ dayOfWeek: 1, periodId: 'p1', subjectId: 'sub1' }]); // get target
      
      mockTimetableRepo.delete.mockResolvedValueOnce({});
      mockTimetableRepo.create.mockReturnValue({});
      mockTimetableRepo.save.mockResolvedValue({});

      const res = await service.copyTimetable('src_c', 'src_s', 'tgt_c', 'tgt_s', 'tenant_1');
      expect(res).toHaveLength(1);
    });

    it('replicateTimetableForNewSession', async () => {
      mockTimetableRepo.find.mockResolvedValueOnce([{ id: 't1', dayOfWeek: 1 }]);
      mockTimetableRepo.create.mockReturnValueOnce({});
      mockTimetableRepo.save.mockResolvedValueOnce({});

      await service.replicateTimetableForNewSession('old_sess', 'new_sess', 'tenant_1');
      expect(mockTimetableRepo.create).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'new_sess' }));
    });
  });
});
