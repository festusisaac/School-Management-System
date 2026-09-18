import { Test, TestingModule } from '@nestjs/testing';
import { SystemSetupService } from '../services/system-setup.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SystemSetting } from '../entities/system-setting.entity';
import { AcademicSession } from '../entities/academic-session.entity';
import { AcademicTerm } from '../entities/academic-term.entity';
import { User } from '../../auth/entities/user.entity';
import { Role } from '../../auth/entities/role.entity';
import { Permission } from '../../auth/entities/permission.entity';
import { SystemSettingsService } from '../services/system-settings.service';
import { ActivityLogService } from '../services/activity-log.service';
import { DataSource } from 'typeorm';
import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

jest.mock('../../../database/seeds/permissions.seed', () => ({
  seedPermissions: jest.fn(),
}));

jest.mock('../../../database/seeds/roles.seed', () => ({
  seedRoles: jest.fn(),
}));

const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  },
};

const mockDataSource = {
  createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
};

const mockSystemSettingsService = {
  getSettings: jest.fn(),
};

const mockActivityLogService = {
  logAction: jest.fn(),
};

describe('SystemSetupService', () => {
  let service: SystemSetupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemSetupService,
        {
          provide: getRepositoryToken(SystemSetting),
          useValue: {},
        },
        {
          provide: getRepositoryToken(AcademicSession),
          useValue: {},
        },
        {
          provide: getRepositoryToken(AcademicTerm),
          useValue: {},
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Role),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: {},
        },
        {
          provide: SystemSettingsService,
          useValue: mockSystemSettingsService,
        },
        {
          provide: ActivityLogService,
          useValue: mockActivityLogService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<SystemSetupService>(SystemSetupService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSetupStatus', () => {
    it('should return initialized status', async () => {
      mockSystemSettingsService.getSettings.mockResolvedValue({ isInitialized: true });
      const res = await service.getSetupStatus();
      expect(res.isInitialized).toBe(true);
    });
  });

  describe('initializeSystem', () => {
    const req = { ip: '127.0.0.1' } as any;
    const dto = {
      sessionName: '2023/2024',
      sessionStartDate: '2023-01-01',
      sessionEndDate: '2023-12-31',
      termName: 'Term 1',
      termStartDate: '2023-01-01',
      termEndDate: '2023-04-01',
      adminEmail: 'admin@test.com',
      adminPassword: 'password',
      adminFirstName: 'Super',
      adminLastName: 'Admin',
      schoolName: 'Test School',
    } as any;

    it('should throw ConflictException if already initialized', async () => {
      mockSystemSettingsService.getSettings.mockResolvedValue({ isInitialized: true });
      await expect(service.initializeSystem(dto, req)).rejects.toThrow(ConflictException);
    });

    it('should throw InternalServerErrorException if super admin role missing', async () => {
      mockSystemSettingsService.getSettings.mockResolvedValue({ isInitialized: false });
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(null); // Role not found
      
      await expect(service.initializeSystem(dto, req)).rejects.toThrow(InternalServerErrorException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should initialize system successfully', async () => {
      mockSystemSettingsService.getSettings.mockResolvedValue({ isInitialized: false });
      
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce({ id: 'role_1', name: 'Super Administrator' }) // Role
        .mockResolvedValueOnce(null) // Session
        .mockResolvedValueOnce(null) // Term
        .mockResolvedValueOnce(null); // User

      mockQueryRunner.manager.create.mockImplementation((entity, data) => data);
      mockQueryRunner.manager.save.mockImplementation(async (entityOrData) => entityOrData);

      const logoFile = { filename: 'logo.png' } as any;

      const res = await service.initializeSystem(dto, req, logoFile);
      
      expect(res.message).toBe('System initialized successfully.');
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockActivityLogService.logAction).toHaveBeenCalled();
    });
    
    it('should initialize system successfully with existing entities', async () => {
      mockSystemSettingsService.getSettings.mockResolvedValue({ isInitialized: false });
      
      mockQueryRunner.manager.findOne
        .mockResolvedValueOnce({ id: 'role_1', name: 'Super Administrator' }) // Role
        .mockResolvedValueOnce({ id: 'sess_1', name: '2023/2024' }) // Session
        .mockResolvedValueOnce({ id: 'term_1', name: 'Term 1' }) // Term
        .mockResolvedValueOnce({ id: 'user_1', email: 'admin@test.com' }); // User

      mockQueryRunner.manager.save.mockImplementation(async (entity, data) => data);

      const res = await service.initializeSystem(dto, req);
      
      expect(res.message).toBe('System initialized successfully.');
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });
  });
});
