import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MessageTemplatesService } from '../services/message-templates.service';
import { MessageTemplate, MessageTemplateType } from '../entities/message-template.entity';
import { NotFoundException } from '@nestjs/common';

describe('MessageTemplatesService', () => {
  let service: MessageTemplatesService;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageTemplatesService,
        { provide: getRepositoryToken(MessageTemplate), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<MessageTemplatesService>(MessageTemplatesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a template', async () => {
      mockRepo.create.mockReturnValue({ id: 't_1' });
      mockRepo.save.mockResolvedValue({ id: 't_1' });

      const res = await service.create({ name: 'T1', type: MessageTemplateType.EMAIL, body: 'B' }, 'tenant_1');
      expect(res.id).toBe('t_1');
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant_1' }));
    });
  });

  describe('findAll', () => {
    it('should return all templates', async () => {
      mockRepo.find.mockResolvedValueOnce([{ id: 't_1' }]);
      const res = await service.findAll('tenant_1');
      expect(res).toHaveLength(1);
    });

    it('should filter by type', async () => {
      mockRepo.find.mockResolvedValueOnce([{ id: 't_1' }]);
      const res = await service.findAll('tenant_1', MessageTemplateType.EMAIL);
      expect(mockRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { tenantId: 'tenant_1', type: MessageTemplateType.EMAIL }
      }));
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      mockRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne('t_1', 'tenant_1')).rejects.toThrow(NotFoundException);
    });

    it('should return if found', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ id: 't_1' });
      const res = await service.findOne('t_1', 'tenant_1');
      expect(res.id).toBe('t_1');
    });
  });

  describe('update', () => {
    it('should update a template', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ id: 't_1', name: 'Old' });
      mockRepo.save.mockImplementation((e) => e);

      const res = await service.update('t_1', { name: 'New' }, 'tenant_1');
      expect(res.name).toBe('New');
    });
  });

  describe('remove', () => {
    it('should remove a template', async () => {
      mockRepo.findOne.mockResolvedValueOnce({ id: 't_1' });
      mockRepo.remove.mockResolvedValueOnce(undefined);

      await service.remove('t_1', 'tenant_1');
      expect(mockRepo.remove).toHaveBeenCalled();
    });
  });
});
