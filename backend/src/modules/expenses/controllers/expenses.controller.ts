import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { PermissionsGuard } from '@guards/permissions.guard';
import { Permissions } from '@decorators/permissions.decorator';
import { CreateExpenseDto, ExpenseQueryDto } from '../dto/create-expense.dto';
import { ExpensesService } from '../services/expenses.service';

@Controller('expenses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get('dashboard')
  @Permissions('expenses:view_reports')
  getDashboard(@Query() query: ExpenseQueryDto, @Req() req: any) {
    return this.expensesService.getDashboard(query, req.user.tenantId);
  }

  @Get()
  @Permissions('expenses:view')
  findAll(@Query() query: ExpenseQueryDto, @Req() req: any) {
    return this.expensesService.findAll(query, req.user.tenantId);
  }

  @Get(':id')
  @Permissions('expenses:view')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.expensesService.findOne(id, req.user.tenantId);
  }

  @Post()
  @Permissions('expenses:manage_records')
  create(@Body() dto: CreateExpenseDto, @Req() req: any) {
    return this.expensesService.create(dto, req.user.tenantId, req.user.id);
  }

  @Patch(':id')
  @Permissions('expenses:manage_records')
  update(@Param('id') id: string, @Body() dto: Partial<CreateExpenseDto>, @Req() req: any) {
    return this.expensesService.update(id, dto, req.user.tenantId, req.user.id);
  }

  @Delete(':id')
  @Permissions('expenses:manage_records')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.expensesService.remove(id, req.user.tenantId);
  }
}
