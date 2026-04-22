import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateExpenseCategoryDto } from '../dto/create-expense-category.dto';
import { ExpenseCategory } from '../entities/expense-category.entity';

@Injectable()
export class ExpenseCategoriesService {
  constructor(
    @InjectRepository(ExpenseCategory)
    private readonly categoryRepo: Repository<ExpenseCategory>,
  ) {}

  async findAll(tenantId: string) {
    return this.categoryRepo.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const category = await this.categoryRepo.findOne({ where: { id, tenantId } });
    if (!category) throw new NotFoundException('Expense category not found');
    return category;
  }

  async create(dto: CreateExpenseCategoryDto, tenantId: string) {
    const existing = await this.categoryRepo.findOne({
      where: { tenantId, name: dto.name.trim() },
    });
    if (existing) throw new ConflictException('Expense category already exists');

    const category = this.categoryRepo.create({
      ...dto,
      name: dto.name.trim(),
      code: dto.code?.trim() || null,
      tenantId,
    });
    return this.categoryRepo.save(category);
  }

  async update(id: string, dto: Partial<CreateExpenseCategoryDto>, tenantId: string) {
    const category = await this.findOne(id, tenantId);

    if (dto.name && dto.name.trim() !== category.name) {
      const existing = await this.categoryRepo.findOne({
        where: { tenantId, name: dto.name.trim() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Expense category already exists');
      }
    }

    Object.assign(category, {
      ...dto,
      name: dto.name?.trim() ?? category.name,
      code: dto.code !== undefined ? dto.code?.trim() || null : category.code,
    });
    return this.categoryRepo.save(category);
  }

  async remove(id: string, tenantId: string) {
    const category = await this.findOne(id, tenantId);
    category.isActive = false;
    return this.categoryRepo.save(category);
  }
}
