import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from '../services/users.service';
import { User } from '../../auth/entities/user.entity';
import { Role } from '../../auth/entities/role.entity';
import { EmailService } from '../../internal-communication/email.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('UsersService', () => {
  let service: UsersService;

  const mockUsersRepo = {
    count: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockRoleRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUsersRepo },
        { provide: getRepositoryToken(Role), useValue: mockRoleRepo },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('seedInitialAdmin', () => {
    it('should seed initial admin if count is 0', async () => {
      mockUsersRepo.count.mockResolvedValueOnce(0);
      mockRoleRepo.findOne.mockResolvedValueOnce(null);
      mockRoleRepo.create.mockReturnValueOnce({ id: 'role_1', name: 'Super Administrator' });
      mockRoleRepo.save.mockResolvedValueOnce({});
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashedPassword');
      mockUsersRepo.create.mockReturnValueOnce({ id: 'user_1' });
      mockUsersRepo.save.mockResolvedValueOnce({});

      await service.onModuleInit();

      expect(mockUsersRepo.count).toHaveBeenCalled();
      expect(mockRoleRepo.create).toHaveBeenCalled();
      expect(mockUsersRepo.create).toHaveBeenCalled();
      expect(mockUsersRepo.save).toHaveBeenCalled();
    });

    it('should not seed if count > 0', async () => {
      mockUsersRepo.count.mockResolvedValueOnce(1);
      await service.onModuleInit();
      expect(mockUsersRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      mockUsersRepo.find.mockResolvedValueOnce([{ id: 'user_1' }]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('user_1');
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockUsersRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('invalid')).rejects.toThrow(NotFoundException);
    });

    it('should return user', async () => {
      mockUsersRepo.findOne.mockResolvedValueOnce({ id: 'user_1' });
      const result = await service.findOne('user_1');
      expect(result.id).toBe('user_1');
    });
  });

  describe('findByEmail', () => {
    it('should return null if no email provided', async () => {
      const result = await service.findByEmail(null);
      expect(result).toBeNull();
    });

    it('should return user by email', async () => {
      mockUsersRepo.findOne.mockResolvedValueOnce({ id: 'user_1' });
      const result = await service.findByEmail('test@test.com');
      expect(result?.id).toBe('user_1');
    });
  });

  describe('create', () => {
    it('should throw ConflictException if email exists', async () => {
      mockUsersRepo.findOne.mockResolvedValueOnce({ id: 'existing' });
      await expect(service.create({ email: 'test@test.com' } as any)).rejects.toThrow(ConflictException);
    });

    it('should hash password and create user', async () => {
      mockUsersRepo.findOne.mockResolvedValueOnce(null);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed');
      mockUsersRepo.create.mockReturnValueOnce({ id: 'new_user' });
      mockUsersRepo.save.mockResolvedValueOnce({ id: 'new_user' });

      const result = await service.create({ email: 'test@test.com', password: 'pass' } as any);
      expect(result.id).toBe('new_user');
      expect(bcrypt.hash).toHaveBeenCalledWith('pass', 10);
    });
  });

  describe('update', () => {
    it('should update user fields and return', async () => {
      mockUsersRepo.findOne.mockResolvedValueOnce({ id: 'user_1' }); // For findOne internal call
      mockUsersRepo.save.mockResolvedValueOnce({ id: 'user_1', firstName: 'Updated' });

      const result = await service.update('user_1', { firstName: 'Updated' } as any);
      expect(result.firstName).toBe('Updated');
    });

    it('should hash password if provided', async () => {
      const existingUser = { id: 'user_1', mustChangePassword: true };
      mockUsersRepo.findOne.mockResolvedValueOnce(existingUser);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('newHashed');
      mockUsersRepo.save.mockImplementationOnce(val => Promise.resolve(val));

      const result = await service.update('user_1', { password: 'new' } as any);
      expect(result.password).toBe('newHashed');
      expect(result.mustChangePassword).toBe(false);
    });

    it('should update roleId and set role', async () => {
      const existingUser = { id: 'user_1' };
      mockUsersRepo.findOne.mockResolvedValueOnce(existingUser);
      mockRoleRepo.findOne.mockResolvedValueOnce({ id: 'role_1', name: 'Admin' });
      mockUsersRepo.save.mockImplementationOnce(val => Promise.resolve(val));

      const result = await service.update('user_1', { roleId: 'role_1' } as any);
      expect(result.roleId).toBe('role_1');
      expect(result.role).toBe('admin');
    });

    it('should throw NotFoundException if roleId is invalid', async () => {
      mockUsersRepo.findOne.mockResolvedValueOnce({ id: 'user_1' });
      mockRoleRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.update('user_1', { roleId: 'invalid' } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove user', async () => {
      const user = { id: 'user_1' };
      mockUsersRepo.findOne.mockResolvedValueOnce(user);
      await service.remove('user_1');
      expect(mockUsersRepo.remove).toHaveBeenCalledWith(user);
    });
  });

  describe('removeByEmail', () => {
    it('should remove user if found', async () => {
      const user = { id: 'user_1' };
      mockUsersRepo.findOne.mockResolvedValueOnce(user);
      await service.removeByEmail('test@test.com', 'tenant_1');
      expect(mockUsersRepo.remove).toHaveBeenCalledWith(user);
    });

    it('should do nothing if user not found', async () => {
      mockUsersRepo.findOne.mockResolvedValueOnce(null);
      await service.removeByEmail('test@test.com', 'tenant_1');
      expect(mockUsersRepo.remove).not.toHaveBeenCalled();
    });
  });

  describe('findOrCreateUser', () => {
    it('should create new user if not found', async () => {
      mockUsersRepo.findOne.mockResolvedValueOnce(null); // findByEmail
      mockUsersRepo.findOne.mockResolvedValueOnce(null); // Inside create, checks findByEmail again
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed');
      mockUsersRepo.create.mockReturnValueOnce({ id: 'new_user' });
      mockUsersRepo.save.mockResolvedValueOnce({ id: 'new_user' });

      const result = await service.findOrCreateUser('new@test.com', { firstName: 'New' } as any);
      expect(result.id).toBe('new_user');
      expect(mockUsersRepo.create).toHaveBeenCalled();
    });

    it('should update existing user if found', async () => {
      const user = { id: 'user_1' };
      mockUsersRepo.findOne.mockResolvedValueOnce(user);
      mockUsersRepo.save.mockImplementationOnce(val => Promise.resolve(val));

      const result = await service.findOrCreateUser('test@test.com', { firstName: 'Updated' } as any);
      expect(result.firstName).toBe('Updated');
      expect(mockUsersRepo.save).toHaveBeenCalled();
    });
  });
});
