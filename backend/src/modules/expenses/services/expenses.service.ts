import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSettingsService } from '@modules/system/services/system-settings.service';
import { CreateExpenseDto, ExpenseQueryDto } from '../dto/create-expense.dto';
import {
  Expense,
  ExpenseStatus,
} from '../entities/expense.entity';
import { ExpenseCategory } from '../entities/expense-category.entity';
import { ExpenseVendor } from '../entities/expense-vendor.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(ExpenseCategory)
    private readonly categoryRepo: Repository<ExpenseCategory>,
    @InjectRepository(ExpenseVendor)
    private readonly vendorRepo: Repository<ExpenseVendor>,
    private readonly systemSettingsService: SystemSettingsService,
  ) {}

  private async ensureRelations(dto: Partial<CreateExpenseDto>, tenantId: string) {
    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: dto.categoryId, tenantId, isActive: true },
      });
      if (!category) throw new BadRequestException('Selected expense category is invalid');
    }

    if (dto.vendorId) {
      const vendor = await this.vendorRepo.findOne({
        where: { id: dto.vendorId, tenantId, isActive: true },
      });
      if (!vendor) throw new BadRequestException('Selected expense vendor is invalid');
    }
  }

  private buildListQuery(tenantId: string, query: ExpenseQueryDto) {
    const qb = this.expenseRepo
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.category', 'category')
      .leftJoinAndSelect('expense.vendor', 'vendor')
      .leftJoinAndSelect('expense.recordedBy', 'recordedBy')
      .leftJoinAndSelect('expense.approvedBy', 'approvedBy')
      .leftJoinAndSelect('expense.schoolSection', 'schoolSection')
      .leftJoinAndSelect('expense.session', 'session')
      .where('expense.tenantId = :tenantId', { tenantId })
      .andWhere('expense.isActive = :isActive', { isActive: true });

    if (query.search) {
      qb.andWhere(
        '(LOWER(expense.title) LIKE :search OR LOWER(COALESCE(expense.referenceNumber, \'\')) LIKE :search OR LOWER(COALESCE(vendor.name, \'\')) LIKE :search)',
        { search: `%${query.search.toLowerCase()}%` },
      );
    }

    if (query.categoryId) qb.andWhere('expense.categoryId = :categoryId', { categoryId: query.categoryId });
    if (query.vendorId) qb.andWhere('expense.vendorId = :vendorId', { vendorId: query.vendorId });
    if (query.status) qb.andWhere('expense.status = :status', { status: query.status });
    if (query.schoolSectionId) qb.andWhere('expense.schoolSectionId = :schoolSectionId', { schoolSectionId: query.schoolSectionId });
    if (query.startDate) qb.andWhere('expense.expenseDate >= :startDate', { startDate: query.startDate });
    if (query.endDate) qb.andWhere('expense.expenseDate <= :endDate', { endDate: query.endDate });

    return qb;
  }

  async create(dto: CreateExpenseDto, tenantId: string, userId?: string) {
    await this.ensureRelations(dto, tenantId);

    const activeSessionId = await this.systemSettingsService.getActiveSessionId();
    const expense = this.expenseRepo.create({
      ...dto,
      sessionId: dto.sessionId || activeSessionId || null,
      recordedById: userId || null,
      tenantId,
    });

    return this.expenseRepo.save(expense);
  }

  async findAll(query: ExpenseQueryDto, tenantId: string) {
    const page = Number(query.page || 1);
    const limit = Math.min(100, Number(query.limit || 20));

    const qb = this.buildListQuery(tenantId, query).orderBy('expense.expenseDate', 'DESC').addOrderBy('expense.createdAt', 'DESC');
    const [items, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();

    return { items, total, page, limit };
  }

  async findOne(id: string, tenantId: string) {
    const expense = await this.expenseRepo.findOne({
      where: { id, tenantId, isActive: true },
      relations: ['category', 'vendor', 'recordedBy', 'approvedBy', 'schoolSection', 'session'],
    });
    if (!expense) throw new NotFoundException('Expense record not found');
    return expense;
  }

  async update(id: string, dto: Partial<CreateExpenseDto>, tenantId: string, userId?: string) {
    const expense = await this.findOne(id, tenantId);
    await this.ensureRelations(dto, tenantId);

    const nextStatus = dto.status ?? expense.status;
    Object.assign(expense, dto);

    if (nextStatus === ExpenseStatus.APPROVED || nextStatus === ExpenseStatus.PAID) {
      expense.approvedById = userId || expense.approvedById || null;
    } else if (nextStatus === ExpenseStatus.REJECTED || nextStatus === ExpenseStatus.PENDING || nextStatus === ExpenseStatus.DRAFT) {
      expense.approvedById = dto.status ? null : expense.approvedById;
    }

    return this.expenseRepo.save(expense);
  }

  async remove(id: string, tenantId: string) {
    const expense = await this.findOne(id, tenantId);
    expense.isActive = false;
    return this.expenseRepo.save(expense);
  }

  async getDashboard(query: ExpenseQueryDto, tenantId: string) {
    const qb = this.buildListQuery(tenantId, query);
    const expenses = await qb.getMany();

    const totalSpent = expenses
      .filter((item) => item.status === ExpenseStatus.PAID)
      .reduce((sum, item) => sum + parseFloat(item.amount || '0'), 0);

    const pendingAmount = expenses
      .filter((item) => item.status === ExpenseStatus.PENDING || item.status === ExpenseStatus.APPROVED)
      .reduce((sum, item) => sum + parseFloat(item.amount || '0'), 0);

    const statusBreakdown = Object.values(ExpenseStatus).map((status) => {
      const items = expenses.filter((item) => item.status === status);
      return {
        status,
        count: items.length,
        amount: items.reduce((sum, item) => sum + parseFloat(item.amount || '0'), 0).toFixed(2),
      };
    });

    const categoryMap = new Map<string, { id: string; name: string; amount: number; count: number }>();
    for (const item of expenses) {
      const key = item.categoryId;
      const existing = categoryMap.get(key) || {
        id: key,
        name: item.category?.name || 'Uncategorized',
        amount: 0,
        count: 0,
      };
      existing.amount += parseFloat(item.amount || '0');
      existing.count += 1;
      categoryMap.set(key, existing);
    }

    const lastSixMonths = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return {
        key,
        label: date.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        total: 0,
      };
    });

    const monthlyMap = new Map(lastSixMonths.map((item) => [item.key, item]));
    for (const item of expenses) {
      const date = new Date(item.expenseDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const bucket = monthlyMap.get(key);
      if (bucket) bucket.total += parseFloat(item.amount || '0');
    }

    return {
      totalRecords: expenses.length,
      totalSpent: totalSpent.toFixed(2),
      pendingAmount: pendingAmount.toFixed(2),
      categoryCount: new Set(expenses.map((item) => item.categoryId)).size,
      vendorCount: new Set(expenses.filter((item) => item.vendorId).map((item) => item.vendorId)).size,
      statusBreakdown,
      categoryBreakdown: Array.from(categoryMap.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8)
        .map((item) => ({ ...item, amount: item.amount.toFixed(2) })),
      monthlyTrend: lastSixMonths.map((item) => ({ ...item, total: item.total.toFixed(2) })),
      recentExpenses: expenses
        .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
        .slice(0, 5),
    };
  }
}
