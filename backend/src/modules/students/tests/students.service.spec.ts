import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StudentsService } from '../services/students.service';
import { Student } from '../entities/student.entity';
import { Parent } from '../entities/parent.entity';
import { StudentDocument } from '../entities/student-document.entity';
import { StudentCategory } from '../entities/student-category.entity';
import { StudentHouse } from '../entities/student-house.entity';
import { DeactivateReason } from '../entities/deactivate-reason.entity';
import { OnlineAdmission } from '../entities/online-admission.entity';
import { Role } from '../../auth/entities/role.entity';
import { StudentAttendance, AttendanceStatus } from '../entities/student-attendance.entity';
import { Class } from '../../academics/entities/class.entity';
import { SchoolSection } from '../../academics/entities/school-section.entity';
import { SmsService } from '../../internal-communication/sms.service';
import { SystemSettingsService } from '../../system/services/system-settings.service';
import { FeesService } from '../../finance/services/fees.service';
import { UsersService } from '../../system/services/users.service';
import { EmailService } from '../../internal-communication/email.service';
import { MessageTemplatesService } from '../../communication/services/message-templates.service';
import { BadRequestException, ConflictException } from '@nestjs/common';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('StudentsService', () => {
  let service: StudentsService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getCount: jest.fn(),
  };

  const createMockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    query: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    manager: { query: jest.fn() },
  });

  const mockStudentRepo = createMockRepository();
  const mockParentRepo = createMockRepository();
  const mockDocumentRepo = createMockRepository();
  const mockCategoryRepo = createMockRepository();
  const mockHouseRepo = createMockRepository();
  const mockDeactivateReasonRepo = createMockRepository();
  const mockOnlineAdmissionRepo = createMockRepository();
  const mockRoleRepo = createMockRepository();
  const mockAttendanceRepo = createMockRepository();
  const mockClassRepo = createMockRepository();
  const mockSchoolSectionRepo = createMockRepository();

  const mockSmsService = { sendSms: jest.fn() };
  const mockSystemSettingsService = { getSettings: jest.fn() };
  const mockFeesService = { assignFeesToStudent: jest.fn() };
  const mockUsersService = { createUser: jest.fn() };
  const mockEmailService = { sendTemplatedEmail: jest.fn() };
  const mockMessageTemplatesService = { renderTemplate: jest.fn() };

  beforeEach(async () => {
    process.env.PAYSTACK_SECRET_KEY = 'test_key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
        { provide: getRepositoryToken(Parent), useValue: mockParentRepo },
        { provide: getRepositoryToken(StudentDocument), useValue: mockDocumentRepo },
        { provide: getRepositoryToken(StudentCategory), useValue: mockCategoryRepo },
        { provide: getRepositoryToken(StudentHouse), useValue: mockHouseRepo },
        { provide: getRepositoryToken(DeactivateReason), useValue: mockDeactivateReasonRepo },
        { provide: getRepositoryToken(OnlineAdmission), useValue: mockOnlineAdmissionRepo },
        { provide: getRepositoryToken(Role), useValue: mockRoleRepo },
        { provide: getRepositoryToken(StudentAttendance), useValue: mockAttendanceRepo },
        { provide: getRepositoryToken(Class), useValue: mockClassRepo },
        { provide: getRepositoryToken(SchoolSection), useValue: mockSchoolSectionRepo },
        { provide: SmsService, useValue: mockSmsService },
        { provide: SystemSettingsService, useValue: mockSystemSettingsService },
        { provide: FeesService, useValue: mockFeesService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: MessageTemplatesService, useValue: mockMessageTemplatesService },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyAdmissionPayment', () => {
    it('should throw BadRequestException on failed payment', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { status: false } });
      await expect(service.verifyAdmissionPayment('ref', 'test@test.com', 'tenant_1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if email mismatches', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { status: true, data: { status: 'success', customer: { email: 'wrong@test.com' } } }
      });
      await expect(service.verifyAdmissionPayment('ref', 'test@test.com', 'tenant_1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if reference used', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { status: true, data: { status: 'success', customer: { email: 'test@test.com' } } }
      });
      mockOnlineAdmissionRepo.findOne.mockResolvedValueOnce({ id: 'ad_1' });

      await expect(service.verifyAdmissionPayment('ref', 'test@test.com', 'tenant_1'))
        .rejects.toThrow(ConflictException);
    });

    it('should verify payment successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { status: true, data: { status: 'success', customer: { email: 'test@test.com' } } }
      });
      mockOnlineAdmissionRepo.findOne.mockResolvedValueOnce(null);

      const result = await service.verifyAdmissionPayment('ref', 'test@test.com', 'tenant_1');
      expect(result.success).toBe(true);
      expect(result.data.customer.email).toBe('test@test.com');
    });
  });

  describe('create', () => {
    it('should create student with new parent', async () => {
      const dto = {
        guardianEmail: 'parent@test.com',
        guardianPhone: '1234567890',
        firstName: 'John',
        lastName: 'Doe',
      } as any;

      mockParentRepo.findOne.mockResolvedValueOnce(null); // No existing parent by email
      mockParentRepo.findOne.mockResolvedValueOnce(null); // No existing parent by phone
      mockParentRepo.create.mockReturnValue({ id: 'p_1' });
      mockParentRepo.save.mockResolvedValue({ id: 'p_1' });
      
      mockStudentRepo.create.mockReturnValue({ id: 'st_1' });
      mockStudentRepo.save.mockResolvedValue({ id: 'st_1', firstName: 'John', admissionNo: 'ADM1234' });

      // Mock user provision
      mockRoleRepo.findOne.mockResolvedValue({ id: 'role_1' });
      mockSystemSettingsService.getSettings.mockResolvedValue({ schoolName: 'Test School' });

      const student = await service.create(dto, 'tenant_1');
      expect(student.id).toBe('st_1');
      expect(mockParentRepo.save).toHaveBeenCalled();
      expect(mockStudentRepo.save).toHaveBeenCalled();
    });

    it('should link sibling via parentId', async () => {
      const dto = {
        parentId: 'p_1',
        guardianEmail: 'parent@test.com', // just to pass the initial validation check
      } as any;

      mockParentRepo.findOne.mockResolvedValueOnce({ id: 'p_1' }); // Parent exists by ID
      mockStudentRepo.create.mockReturnValue({ id: 'st_1' });
      mockStudentRepo.save.mockResolvedValue({ id: 'st_1', admissionNo: 'ADM1234' });

      const student = await service.create(dto, 'tenant_1');
      expect(student.id).toBe('st_1');
      // parentRepository.save shouldn't be called for new parent creation if parent is found
      // Wait, syncParentDetails is called. We'll just check if it completed.
      expect(mockStudentRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if no contact info provided', async () => {
      const dto = { firstName: 'John' } as any;
      await expect(service.create(dto, 'tenant_1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('CRUD and Queries', () => {
    it('findAll should return students', async () => {
      mockStudentRepo.find.mockResolvedValue([{ id: 'st_1' }]);
      const res = await service.findAll({ classId: 'cls_1', keyword: 'John' }, 'tenant_1');
      expect(res).toEqual([{ id: 'st_1' }]);
      expect(mockStudentRepo.find).toHaveBeenCalled();
    });

    it('findOne should return student with fee groups', async () => {
      mockStudentRepo.findOne.mockResolvedValue({ id: 'st_1' });
      mockFeesService.assignFeesToStudent = jest.fn();
      
      // We must inject mock implementation for feesService calls made in findOne
      (service as any).feesService = {
        getAssignmentsByStudent: jest.fn().mockResolvedValue([{ feeGroupId: 'fg_1', feeGroup: { id: 'fg_1' } }]),
        getFeeAssignmentProtection: jest.fn().mockResolvedValue(null),
        getPreviousSessionFeeAssignmentSuggestion: jest.fn().mockResolvedValue(null)
      };
      
      const res = await service.findOne('st_1', 'tenant_1');
      expect(res.id).toBe('st_1');
      expect((res as any).feeGroupIds).toContain('fg_1');
    });

    it('update should modify and save student', async () => {
      mockStudentRepo.findOne.mockResolvedValue({ id: 'st_1', firstName: 'OldName' });
      mockStudentRepo.save.mockResolvedValue({ id: 'st_1', firstName: 'NewName' });
      
      // Again mock fee functions called internally
      (service as any).feesService = {
        getAssignmentsByStudent: jest.fn().mockResolvedValue([]),
        getFeeAssignmentProtection: jest.fn().mockResolvedValue(null),
        getPreviousSessionFeeAssignmentSuggestion: jest.fn().mockResolvedValue(null),
        assignFeesToStudent: jest.fn()
      };
      
      const res = await service.update('st_1', { firstName: 'NewName' } as any, 'tenant_1');
      expect(mockStudentRepo.save).toHaveBeenCalled();
    });

    it('remove should delete student', async () => {
      mockStudentRepo.findOne.mockResolvedValue({ id: 'st_1' });
      (service as any).feesService = {
        getAssignmentsByStudent: jest.fn().mockResolvedValue([]),
        getFeeAssignmentProtection: jest.fn().mockResolvedValue(null),
        getPreviousSessionFeeAssignmentSuggestion: jest.fn().mockResolvedValue(null),
      };
      await service.remove('st_1', 'tenant_1');
      expect(mockStudentRepo.remove).toHaveBeenCalled();
    });
  });

  describe('Status Management', () => {
    it('deactivate should mark student inactive', async () => {
      mockStudentRepo.findOne.mockResolvedValue({ id: 'st_1', isActive: true, userId: 'usr_1', parentId: 'p_1' });
      mockParentRepo.findOne.mockResolvedValue({ id: 'p_1', userId: 'usr_2', students: [] }); 
      (service as any).usersService = { update: jest.fn() };
      
      (service as any).feesService = {
        getAssignmentsByStudent: jest.fn().mockResolvedValue([]),
        getFeeAssignmentProtection: jest.fn().mockResolvedValue(null),
        getPreviousSessionFeeAssignmentSuggestion: jest.fn().mockResolvedValue(null),
      };

      await service.deactivate('st_1', 'tenant_1', 'reason_1');
      expect(mockStudentRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: false, deactivateReasonId: 'reason_1' }));
      expect((service as any).usersService.update).toHaveBeenCalledWith('usr_1', { isActive: false });
      expect((service as any).usersService.update).toHaveBeenCalledWith('usr_2', { isActive: false });
    });

    it('activate should mark student active', async () => {
      mockStudentRepo.findOne.mockResolvedValue({ id: 'st_1', isActive: false, userId: 'usr_1', parentId: 'p_1' });
      mockParentRepo.findOne.mockResolvedValue({ id: 'p_1', userId: 'usr_2' });
      (service as any).usersService = { update: jest.fn() };
      
      (service as any).feesService = {
        getAssignmentsByStudent: jest.fn().mockResolvedValue([]),
        getFeeAssignmentProtection: jest.fn().mockResolvedValue(null),
        getPreviousSessionFeeAssignmentSuggestion: jest.fn().mockResolvedValue(null),
      };

      await service.activate('st_1', 'tenant_1');
      expect(mockStudentRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: true }));
      expect((service as any).usersService.update).toHaveBeenCalledWith('usr_1', { isActive: true });
      expect((service as any).usersService.update).toHaveBeenCalledWith('usr_2', { isActive: true });
    });

    it('findDeactivatedStudents should return inactive students', async () => {
      mockStudentRepo.find.mockResolvedValue([{ id: 'st_1', isActive: false }]);
      const res = await service.findDeactivatedStudents('tenant_1');
      expect(res.length).toBe(1);
      expect(res[0].isActive).toBe(false);
    });
  });

  describe('Portal Logic', () => {
    it('findByUserId should return student', async () => {
      mockStudentRepo.findOne.mockResolvedValue({ id: 'st_1' });
      const res = await service.findByUserId('usr_1');
      expect(res?.id).toBe('st_1');
    });

    it('resolveStudentId should return ID', async () => {
      mockStudentRepo.findOne.mockResolvedValue({ id: 'st_1' });
      const res = await service.resolveStudentId('usr_1', 'tenant_1');
      expect(res).toBe('st_1');
    });

    it('getMyChildren should execute raw query', async () => {
      mockStudentRepo.manager = { query: jest.fn().mockResolvedValue([{ id: 'st_1' }]) };
      const res = await service.getMyChildren('usr_1', 'tenant_1');
      expect(res.length).toBe(1);
    });
  });

  describe('Offline Provisioning', () => {
    it('provisionNewStudentCreatedOffline should create parent and users', async () => {
      mockStudentRepo.findOne.mockResolvedValue({ 
        id: 'st_1', guardianEmail: 'test@test.com', firstName: 'John', admissionNo: 'ADM1' 
      });
      mockParentRepo.findOne.mockResolvedValue(null);
      mockParentRepo.create.mockReturnValue({ id: 'p_1' });
      mockParentRepo.save.mockResolvedValue({ id: 'p_1', guardianEmail: 'test@test.com' });

      (service as any).usersService = {
         findOrCreateUser: jest.fn().mockResolvedValue({ id: 'u_1' }),
         create: jest.fn().mockResolvedValue({ id: 'u_2', email: 'test@test.com', firstName: 'Test' }),
         findByEmail: jest.fn().mockResolvedValue(null)
      };
      
      mockRoleRepo.findOne.mockResolvedValue({ id: 'r_1' });

      await service.provisionNewStudentCreatedOffline('st_1', 'tenant_1');
      expect(mockParentRepo.save).toHaveBeenCalled();
      expect((service as any).usersService.findOrCreateUser).toHaveBeenCalled();
      expect((service as any).usersService.create).toHaveBeenCalled();
    });
  });

  describe('Bulk and Parent Sync', () => {
    it('validateBulk should flag missing fields and duplicates', async () => {
      mockStudentRepo.query = jest.fn().mockImplementation((q) => {
        if (q.includes('classes')) return [{ id: 'cls_1', name: 'Class 1' }];
        if (q.includes('sections')) return [{ id: 'sec_1', name: 'Section A', classId: 'cls_1' }];
        return [];
      });
      mockCategoryRepo.find.mockResolvedValue([{ id: 'cat_1', category: 'General' }]);
      mockHouseRepo.find.mockResolvedValue([{ id: 'h_1', houseName: 'Red' }]);
      mockStudentRepo.find.mockResolvedValue([{ admissionNo: 'EXISTING1' }]);

      const data = [
        { admissionNo: 'EXISTING1', firstName: 'John', gender: 'Male', dob: '2020-01-01', admissionDate: '2025-01-01', className: 'Class 1', sectionName: 'Section A' },
        { firstName: 'NoAdm', gender: 'Male', dob: '2020-01-01', admissionDate: '2025-01-01' },
        { admissionNo: 'NEW1', firstName: 'Jane', gender: 'Female', dob: '2020-01-01', admissionDate: '2025-01-01', className: 'Class 1', sectionName: 'Section A', categoryName: 'General', houseName: 'Red' }
      ];

      const res = await service.validateBulk(data, 'tenant_1');
      expect(res.length).toBe(3);
      expect(res[0].validationStatus).toBe('Invalid');
      expect(res[1].validationStatus).toBe('Invalid');
      expect(res[2].validationStatus).toBe('Valid');
      expect(res[2].classId).toBe('cls_1');
    });

    it('syncParentDetails should sync photo to usersService', async () => {
      mockParentRepo.update.mockResolvedValue({});
      mockParentRepo.findOne.mockResolvedValue({ id: 'p_1', userId: 'u_1', guardianPhoto: 'new.jpg' });
      (service as any).usersService = { update: jest.fn() };

      await (service as any).syncParentDetails('p_1', { guardianPhoto: 'new.jpg' });
      expect(mockParentRepo.update).toHaveBeenCalled();
      expect((service as any).usersService.update).toHaveBeenCalledWith('u_1', { photo: 'new.jpg' });
    });
  });

  describe('Attendance', () => {
    it('markAttendance should save attendance', async () => {
      (mockSystemSettingsService as any).getActiveSessionId = jest.fn().mockResolvedValue('sess_1');
      mockAttendanceRepo.findOne.mockResolvedValue(null);
      mockAttendanceRepo.create.mockReturnValue({ id: 'att_1' });
      mockAttendanceRepo.save.mockResolvedValue({ id: 'att_1' });

      await service.markAttendance({ studentId: 'st_1', date: '2023-01-01', status: AttendanceStatus.PRESENT, classId: 'cls_1' }, 'tenant_1');
      expect(mockAttendanceRepo.create).toHaveBeenCalled();
      expect(mockAttendanceRepo.save).toHaveBeenCalled();
    });

    it('bulkMarkAttendance should process multiple records and send SMS on absent', async () => {
      (mockSystemSettingsService as any).getActiveSessionId = jest.fn().mockResolvedValue('sess_1');
      mockAttendanceRepo.findOne.mockResolvedValue(null);
      mockAttendanceRepo.create.mockReturnValue({ id: 'att_1' });
      mockAttendanceRepo.save.mockResolvedValue({ id: 'att_1' });
      
      mockStudentRepo.findOne.mockResolvedValue({ id: 'st_1', firstName: 'John', lastName: 'Doe', parent: { guardianPhone: '123', guardianEmail: 'test@test.com' } });
      mockSmsService.sendSms = jest.fn().mockResolvedValue(true);
      (mockEmailService as any).sendEmail = jest.fn().mockResolvedValue(true);

      const res = await service.bulkMarkAttendance({ records: [
        { studentId: 'st_1', date: '2023-01-01', status: AttendanceStatus.ABSENT, classId: 'cls_1' }
      ] }, 'tenant_1');

      expect(res.length).toBe(1);
      // Wait a tick for async notification to fire
      await new Promise(r => setTimeout(r, 10));
      expect(mockSmsService.sendSms).toHaveBeenCalled();
      expect((mockEmailService as any).sendEmail).toHaveBeenCalled();
    });

    it('getStudentAttendance should return records', async () => {
      mockStudentRepo.findOne.mockResolvedValue({ id: 'st_1' });
      (mockSystemSettingsService as any).getActiveSessionId = jest.fn().mockResolvedValue('sess_1');
      mockAttendanceRepo.find.mockResolvedValue([{ id: 'att_1' }]);

      const res = await service.getStudentAttendance('st_1', '2023-01-01', '2023-01-31', 'tenant_1');
      expect(res.length).toBe(1);
    });

    it('getClassAttendance should return records', async () => {
      (mockSystemSettingsService as any).getActiveSessionId = jest.fn().mockResolvedValue('sess_1');
      mockAttendanceRepo.find.mockResolvedValue([{ id: 'att_1' }]);

      const res = await service.getClassAttendance('cls_1', '2023-01-01', 'tenant_1');
      expect(res.length).toBe(1);
    });
  });

  describe('Categories, Houses, and Reasons', () => {
    it('createCategory should save and return category', async () => {
      mockCategoryRepo.create.mockReturnValue({ id: 'cat_1' });
      mockCategoryRepo.save.mockResolvedValue({ id: 'cat_1', category: 'General' });
      const res = await service.createCategory({ category: 'General', description: '' } as any, 'tenant_1');
      expect(res.id).toBe('cat_1');
    });
    
    it('findAllCategories should return categories', async () => {
      mockCategoryRepo.find.mockResolvedValue([{ id: 'cat_1' }]);
      const res = await service.findAllCategories('tenant_1');
      expect(res.length).toBe(1);
    });

    it('createHouse should save and return house', async () => {
      mockHouseRepo.create.mockReturnValue({ id: 'h_1' });
      mockHouseRepo.save.mockResolvedValue({ id: 'h_1' });
      const res = await service.createHouse({ houseName: 'Red' } as any, 'tenant_1');
      expect(res.id).toBe('h_1');
    });

    it('findAllHouses should return houses', async () => {
      mockHouseRepo.find.mockResolvedValue([{ id: 'h_1' }]);
      const res = await service.findAllHouses('tenant_1');
      expect(res.length).toBe(1);
    });

    it('createDeactivateReason should save reason', async () => {
      mockDeactivateReasonRepo.create.mockReturnValue({ id: 'dr_1' });
      mockDeactivateReasonRepo.save.mockResolvedValue({ id: 'dr_1' });
      const res = await service.createDeactivateReason({ reason: 'Graduated' } as any, 'tenant_1');
      expect(res.id).toBe('dr_1');
    });

    it('findAllDeactivateReasons should return reasons', async () => {
      mockDeactivateReasonRepo.find.mockResolvedValue([{ id: 'dr_1' }]);
      const res = await service.findAllDeactivateReasons('tenant_1');
      expect(res.length).toBe(1);
    });
  });

  describe('Online Admissions', () => {
    it('createOnlineAdmission should generate ref and save', async () => {
      (mockSystemSettingsService as any).getSettings = jest.fn().mockResolvedValue({ admissionReferencePrefix: 'ADM/' });
      mockOnlineAdmissionRepo.count.mockResolvedValue(0);
      mockOnlineAdmissionRepo.create.mockReturnValue({ id: 'oa_1' });
      mockOnlineAdmissionRepo.save.mockResolvedValue({ id: 'oa_1', referenceNumber: 'ADM/2023/0001' });

      const res = await service.createOnlineAdmission({ 
        firstName: 'John', lastName: 'Doe', guardianEmail: 'test@test.com' 
      } as any, 'tenant_1');

      expect(res.id).toBe('oa_1');
      expect(mockOnlineAdmissionRepo.save).toHaveBeenCalled();
    });

    it('approveOnlineAdmission should convert to student and update status', async () => {
      (mockSystemSettingsService as any).getSettings = jest.fn().mockResolvedValue({ admissionNumberPrefix: 'SCH/' });
      mockOnlineAdmissionRepo.findOne.mockResolvedValue({ 
        id: 'oa_1', status: 'pending', firstName: 'John', lastName: 'Doe', guardianEmail: 'test@test.com' 
      });
      
      mockParentRepo.findOne.mockResolvedValue(null);
      mockParentRepo.create.mockReturnValue({ id: 'p_1' });
      mockParentRepo.save.mockResolvedValue({ id: 'p_1', guardianEmail: 'test@test.com' });
      mockStudentRepo.create.mockReturnValue({ id: 'st_new' });
      mockStudentRepo.save.mockResolvedValue({ id: 'st_new' });
      
      mockOnlineAdmissionRepo.save.mockResolvedValue({ id: 'oa_1', status: 'approved' });

      const res = await service.approveOnlineAdmission('oa_1', 'tenant_1');
      expect(res.id).toBe('st_new');
      expect(mockOnlineAdmissionRepo.save).toHaveBeenCalled();
    });
  });
});
