import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FeesService } from '../services/fees.service';
import { Transaction } from '../entities/transaction.entity';
import { FeeStructure } from '../entities/fee-structure.entity';
import { Discount } from '../entities/discount.entity';
import { PaymentReminder } from '../entities/payment-reminder.entity';
import { CarryForward } from '../entities/carry-forward.entity';
import { Student } from '../../students/entities/student.entity';
import { FeeHead } from '../entities/fee-head.entity';
import { FeeGroup } from '../entities/fee-group.entity';
import { FeeAssignment } from '../entities/fee-assignment.entity';
import { DiscountProfile } from '../entities/discount-profile.entity';
import { DiscountRule } from '../entities/discount-rule.entity';
import { AcademicSession } from '../../system/entities/academic-session.entity';
import { SystemSettingsService } from '../../system/services/system-settings.service';
import { EmailService } from '../../internal-communication/email.service';
import { SmsService } from '../../internal-communication/sms.service';
import { getQueueToken } from '@nestjs/bull';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FeesService', () => {
  let service: FeesService;

  const createMockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    }),
    manager: {
      transaction: jest.fn().mockImplementation(async (cb) => {
        return cb({
          query: jest.fn(),
          findOne: jest.fn(),
          create: jest.fn(),
          save: jest.fn(),
        });
      }),
    },
  });

  const mockTransactionRepo = createMockRepository();
  const mockStructureRepo = createMockRepository();
  const mockDiscountRepo = createMockRepository();
  const mockReminderRepo = createMockRepository();
  const mockCarryRepo = createMockRepository();
  const mockStudentRepo = createMockRepository();
  const mockHeadRepo = createMockRepository();
  const mockGroupRepo = createMockRepository();
  const mockAssignmentRepo = createMockRepository();
  const mockDiscountProfileRepo = createMockRepository();
  const mockDiscountRuleRepo = createMockRepository();
  const mockSessionRepo = createMockRepository();

  const mockFinanceQueue = { add: jest.fn() };
  const mockSystemSettingsService = { getSettings: jest.fn() };
  const mockEmailService = { sendTemplatedEmail: jest.fn() };
  const mockSmsService = { sendSms: jest.fn() };

  beforeEach(async () => {
    process.env.PAYSTACK_SECRET_KEY = 'test_key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeesService,
        { provide: getQueueToken('finance'), useValue: mockFinanceQueue },
        { provide: getRepositoryToken(Transaction), useValue: mockTransactionRepo },
        { provide: getRepositoryToken(FeeStructure), useValue: mockStructureRepo },
        { provide: getRepositoryToken(Discount), useValue: mockDiscountRepo },
        { provide: getRepositoryToken(PaymentReminder), useValue: mockReminderRepo },
        { provide: getRepositoryToken(CarryForward), useValue: mockCarryRepo },
        { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
        { provide: getRepositoryToken(FeeHead), useValue: mockHeadRepo },
        { provide: getRepositoryToken(FeeGroup), useValue: mockGroupRepo },
        { provide: getRepositoryToken(FeeAssignment), useValue: mockAssignmentRepo },
        { provide: getRepositoryToken(DiscountProfile), useValue: mockDiscountProfileRepo },
        { provide: getRepositoryToken(DiscountRule), useValue: mockDiscountRuleRepo },
        { provide: getRepositoryToken(AcademicSession), useValue: mockSessionRepo },
        { provide: SystemSettingsService, useValue: mockSystemSettingsService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: SmsService, useValue: mockSmsService },
      ],
    }).compile();

    service = module.get<FeesService>(FeesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createHead', () => {
    it('should create a fee head', async () => {
      mockHeadRepo.findOne.mockResolvedValueOnce(null);
      mockHeadRepo.create.mockReturnValue({ id: 'h_1' });
      mockHeadRepo.save.mockResolvedValue({ id: 'h_1', name: 'Tuition' });

      const res = await service.createHead({ name: 'Tuition', description: '' }, 'tenant_1');
      expect((res as any).id).toBe('h_1');
    });
  });

  describe('createGroup', () => {
    it('should create fee group and add heads', async () => {
      mockGroupRepo.findOne.mockResolvedValueOnce(null);
      mockGroupRepo.create.mockReturnValue({ id: 'g_1' });
      mockGroupRepo.save.mockResolvedValue({ id: 'g_1', name: 'Term 1' });
      
      const dto = { name: 'Term 1', termId: 'term_1', headIds: ['h_1'] };
      const res = await service.createGroup(dto as any, 'tenant_1');
      
      expect(mockGroupRepo.save).toHaveBeenCalled();
      expect((res as any).id).toBe('g_1');
    });
  });

  describe('recordPayment', () => {
    it('should throw BadRequestException if amount is less than or equal to zero', async () => {
      const dto = { studentId: 'st_1', amount: '0' };
      await expect(service.recordPayment(dto as any, 'tenant_1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if student does not exist', async () => {
      // Mock transaction manager
      const mockManager = {
        query: jest.fn(),
        findOne: jest.fn().mockResolvedValue(null), // Student not found
      };
      mockTransactionRepo.manager = { transaction: jest.fn().mockImplementation((cb) => cb(mockManager)) } as any;

      const dto = { studentId: 'invalid_st', amount: '100' };
      await expect(service.recordPayment(dto as any, 'tenant_1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if reference already exists', async () => {
      const mockManager = {
        query: jest.fn(),
        findOne: jest.fn()
          .mockResolvedValueOnce({ id: 'st_1', class: {} }) // First call finds student
          .mockResolvedValueOnce({ id: 'tx_1', reference: 'REF123' }), // Second call finds existing transaction reference
      };
      mockTransactionRepo.manager = { transaction: jest.fn().mockImplementation((cb) => cb(mockManager)) } as any;

      const dto = { studentId: 'st_1', amount: '100', reference: 'REF123' };
      await expect(service.recordPayment(dto as any, 'tenant_1')).rejects.toThrow(ConflictException);
    });
  });
});
