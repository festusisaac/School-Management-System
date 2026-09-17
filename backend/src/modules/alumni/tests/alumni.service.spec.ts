import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AlumniService } from '../services/alumni.service';
import { Alumni } from '../entities/alumni.entity';
import { AlumniEvent } from '../entities/alumni-event.entity';
import { AlumniAttendee } from '../entities/alumni-attendee.entity';
import { Student } from '../../students/entities/student.entity';
import { User } from '../../auth/entities/user.entity';
import { StudentsService } from '../../students/services/students.service';
import { BroadcastService } from '../../communication/services/broadcast.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('AlumniService', () => {
  let service: AlumniService;

  const createMockRepo = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  });

  const mockAlumniRepo = createMockRepo();
  const mockEventRepo = createMockRepo();
  const mockAttendeeRepo = createMockRepo();
  const mockStudentRepo = createMockRepo();
  const mockUserRepo = createMockRepo();

  const mockStudentsService = {
    deactivate: jest.fn(),
  };

  const mockBroadcastService = {
    broadcast: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlumniService,
        { provide: getRepositoryToken(Alumni), useValue: mockAlumniRepo },
        { provide: getRepositoryToken(AlumniEvent), useValue: mockEventRepo },
        { provide: getRepositoryToken(AlumniAttendee), useValue: mockAttendeeRepo },
        { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: StudentsService, useValue: mockStudentsService },
        { provide: BroadcastService, useValue: mockBroadcastService },
      ],
    }).compile();

    service = module.get<AlumniService>(AlumniService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw if student already registered', async () => {
      mockAlumniRepo.findOne.mockResolvedValueOnce({ id: 'a_1' });
      await expect(service.create({ studentId: 'st_1' } as any, 'tenant_1')).rejects.toThrow(ConflictException);
    });

    it('should create alumni', async () => {
      mockAlumniRepo.findOne.mockResolvedValueOnce(null);
      mockAlumniRepo.create.mockReturnValue({ id: 'a_1' });
      mockAlumniRepo.save.mockResolvedValue({ id: 'a_1' });

      const res = await service.create({ studentId: 'st_1' } as any, 'tenant_1');
      expect(res.id).toBe('a_1');
    });
  });

  describe('graduateStudent', () => {
    it('should graduate student and deactivate record', async () => {
      mockStudentRepo.findOne.mockResolvedValueOnce({ id: 'st_1', email: 's@test.com' });
      mockAlumniRepo.findOne.mockResolvedValueOnce(null);
      mockAlumniRepo.create.mockReturnValue({ id: 'a_1' });
      mockAlumniRepo.save.mockResolvedValue({ id: 'a_1' });
      mockStudentsService.deactivate.mockResolvedValueOnce(undefined);

      const res = await service.graduateStudent({ studentId: 'st_1', graduationYear: 2026 }, 'tenant_1');
      expect(res.id).toBe('a_1');
      expect(mockStudentsService.deactivate).toHaveBeenCalledWith('st_1', 'tenant_1');
    });

    it('should throw if student not found', async () => {
      mockStudentRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.graduateStudent({ studentId: 'st_1' } as any, 'tenant_1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkGraduate', () => {
    it('should graduate multiple students', async () => {
      mockStudentRepo.find.mockResolvedValueOnce([{ id: 'st_1' }, { id: 'st_2' }]);
      mockAlumniRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'a_1' }); // First not existing, second existing
      mockAlumniRepo.create.mockReturnValue({ id: 'a_new' });
      mockAlumniRepo.save.mockResolvedValue({ id: 'a_new' });
      mockStudentsService.deactivate.mockResolvedValue(undefined);

      const res = await service.bulkGraduate({ studentIds: ['st_1', 'st_2'], graduationYear: 2026 }, 'tenant_1');
      expect(res.graduated).toBe(1);
      expect(res.skipped).toBe(1);
    });
  });

  describe('createEvent', () => {
    it('should create event and send notification if required', async () => {
      mockEventRepo.create.mockReturnValue({ id: 'e_1', eventDate: new Date() });
      mockEventRepo.save.mockResolvedValue({ id: 'e_1', eventDate: new Date() });
      mockBroadcastService.broadcast.mockResolvedValue(true);

      const res = await service.createEvent({ title: 'Ev', eventDate: '2026-10-10', sendNotification: true } as any, 'tenant_1');
      expect(res.id).toBe('e_1');
      expect(mockBroadcastService.broadcast).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove alumni and their attendees', async () => {
      mockAlumniRepo.findOne.mockResolvedValueOnce({ id: 'a_1' });
      mockAttendeeRepo.delete.mockResolvedValueOnce(undefined);
      mockAlumniRepo.remove.mockResolvedValueOnce(undefined);

      await service.remove('a_1', 'tenant_1');
      expect(mockAttendeeRepo.delete).toHaveBeenCalledWith({ alumniId: 'a_1' });
      expect(mockAlumniRepo.remove).toHaveBeenCalled();
    });
  });
});
