import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateExpenseVendorDto } from '../dto/create-expense-vendor.dto';
import { ExpenseVendor } from '../entities/expense-vendor.entity';

@Injectable()
export class ExpenseVendorsService {
  constructor(
    @InjectRepository(ExpenseVendor)
    private readonly vendorRepo: Repository<ExpenseVendor>,
  ) {}

  async findAll(tenantId: string) {
    return this.vendorRepo.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const vendor = await this.vendorRepo.findOne({ where: { id, tenantId } });
    if (!vendor) throw new NotFoundException('Expense vendor not found');
    return vendor;
  }

  async create(dto: CreateExpenseVendorDto, tenantId: string) {
    const existing = await this.vendorRepo.findOne({
      where: { tenantId, name: dto.name.trim() },
    });
    if (existing) throw new ConflictException('Expense vendor already exists');

    const vendor = this.vendorRepo.create({
      ...dto,
      name: dto.name.trim(),
      tenantId,
    });
    return this.vendorRepo.save(vendor);
  }

  async update(id: string, dto: Partial<CreateExpenseVendorDto>, tenantId: string) {
    const vendor = await this.findOne(id, tenantId);

    if (dto.name && dto.name.trim() !== vendor.name) {
      const existing = await this.vendorRepo.findOne({
        where: { tenantId, name: dto.name.trim() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Expense vendor already exists');
      }
    }

    Object.assign(vendor, {
      ...dto,
      name: dto.name?.trim() ?? vendor.name,
    });
    return this.vendorRepo.save(vendor);
  }

  async remove(id: string, tenantId: string) {
    const vendor = await this.findOne(id, tenantId);
    vendor.isActive = false;
    return this.vendorRepo.save(vendor);
  }
}
