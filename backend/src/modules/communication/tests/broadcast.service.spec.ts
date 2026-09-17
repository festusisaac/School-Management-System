import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BroadcastService } from '../services/broadcast.service';
import { Student } from '../../students/entities/student.entity';
import { Staff } from '../../hr/entities/staff.entity';
import { Alumni } from '../../alumni/entities/alumni.entity';
import { MessageTemplate } from '../entities/message-template.entity';
import { CommunicationLog } from '../entities/communication-log.entity';
import { EmailService } from '../../internal-communication/email.service';
import { SmsService } from '../../internal-communication/sms.service';
import { FeesService } from '../../finance/services/fees.service';
import { SystemSettingsService } from '../../system/services/system-settings.service';
import { BroadcastTarget } from '../dto/send-broadcast.dto';

describe('BroadcastService', () => {
  let service: BroadcastService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const createMockRepo = () => ({
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    manager: {
      query: jest.fn(),
    }
  });

  const mockStudentRepo = createMockRepo();
  const mockStaffRepo = createMockRepo();
  const mockAlumniRepo = createMockRepo();
  const mockTemplateRepo = createMockRepo();
  const mockLogRepo = createMockRepo();

  const mockEmailService = { sendEmail: jest.fn() };
  const mockSmsService = { sendSms: jest.fn() };
  const mockFeesService = { 
    debtorsList: jest.fn(),
    getStudentCurrentBalance: jest.fn()
  };
  const mockSystemSettingsService = { getSettings: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BroadcastService,
        { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
        { provide: getRepositoryToken(Staff), useValue: mockStaffRepo },
        { provide: getRepositoryToken(Alumni), useValue: mockAlumniRepo },
        { provide: getRepositoryToken(MessageTemplate), useValue: mockTemplateRepo },
        { provide: getRepositoryToken(CommunicationLog), useValue: mockLogRepo },
        { provide: EmailService, useValue: mockEmailService },
        { provide: SmsService, useValue: mockSmsService },
        { provide: FeesService, useValue: mockFeesService },
        { provide: SystemSettingsService, useValue: mockSystemSettingsService },
      ],
    }).compile();

    service = module.get<BroadcastService>(BroadcastService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('broadcast', () => {
    beforeEach(() => {
      mockSystemSettingsService.getSettings.mockResolvedValue({ schoolName: 'Test School' });
      mockLogRepo.create.mockReturnValue({ id: 'log_1' });
      mockLogRepo.save.mockResolvedValue({ id: 'log_1' });
    });

    it('should handle zero recipients gracefully', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([]);
      const res = await service.broadcast({
        target: BroadcastTarget.ALL_STUDENTS,
        channel: 'EMAIL',
        body: 'Hello',
      }, 'tenant_1');
      
      expect(res.queued).toBe(0);
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should resolve ALL_STUDENTS and send EMAIL', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([
        { id: 's_1', firstName: 'John', email: 'john@test.com' }, // has student email
      ]);
      
      const res = await service.broadcast({
        target: BroadcastTarget.ALL_STUDENTS,
        channel: 'EMAIL',
        subject: 'Welcome to {school_name}',
        body: 'Hello {first_name}',
      }, 'tenant_1');

      expect(res.queued).toBe(1);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@test.com',
          subject: 'Welcome to Test School',
          html: 'Hello John',
        }),
        0
      );
    });

    it('should resolve STAFF and send SMS', async () => {
      mockStaffRepo.find.mockResolvedValueOnce([
        { id: 'st_1', firstName: 'Jane', phone: '1234567890' },
      ]);
      
      const res = await service.broadcast({
        target: BroadcastTarget.STAFF,
        channel: 'SMS',
        body: 'Hello {first_name}',
      }, 'tenant_1');

      expect(res.queued).toBe(1);
      expect(mockSmsService.sendSms).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '1234567890',
          message: 'Hello Jane',
        }),
        0
      );
    });

    it('should filter out duplicates and users with no contact info', async () => {
      mockStaffRepo.find.mockResolvedValueOnce([
        { id: 'st_1', firstName: 'Jane', phone: '1234567890' }, // valid
        { id: 'st_2', firstName: 'Clone', phone: '1234567890' }, // duplicate phone
        { id: 'st_3', firstName: 'NoPhone' }, // missing phone
      ]);
      
      const res = await service.broadcast({
        target: BroadcastTarget.STAFF,
        channel: 'SMS',
        body: 'Hello',
      }, 'tenant_1');

      expect(res.queued).toBe(1); // Only Jane is processed
    });

    it('should handle DEBTORS_ONLY by fetching debtors from fees service', async () => {
      mockFeesService.debtorsList.mockResolvedValueOnce({
        items: [{ student: { id: 's_1', email: 'debtor@test.com' } }]
      });

      const res = await service.broadcast({
        target: BroadcastTarget.DEBTORS_ONLY,
        channel: 'EMAIL',
        body: 'Pay your fees',
      }, 'tenant_1');

      expect(res.queued).toBe(1);
      expect(mockFeesService.debtorsList).toHaveBeenCalled();
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'debtor@test.com' }),
        0
      );
    });
  });

  describe('getLogs', () => {
    it('should return logs', async () => {
      mockQueryBuilder.getMany.mockResolvedValueOnce([{ id: 'log_1' }]);
      const res = await service.getLogs('tenant_1');
      expect(res).toHaveLength(1);
    });
  });

  describe('getLogsByStudent', () => {
    it('should return logs for student', async () => {
      mockLogRepo.find.mockResolvedValueOnce([{ id: 'log_1' }]);
      const res = await service.getLogsByStudent('student_1', 'tenant_1');
      expect(res).toHaveLength(1);
    });
  });
});
