import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { PermissionsGuard } from '@guards/permissions.guard';
import { Permissions } from '@decorators/permissions.decorator';
import { CreateExpenseCategoryDto } from '../dto/create-expense-category.dto';
import { ExpenseCategoriesService } from '../services/expense-categories.service';

@Controller('expenses/categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ExpenseCategoriesController {
  constructor(private readonly categoriesService: ExpenseCategoriesService) {}

  @Get()
  @Permissions('expenses:view')
  findAll(@Req() req: any) {
    return this.categoriesService.findAll(req.user.tenantId);
  }

  @Post()
  @Permissions('expenses:manage_categories')
  create(@Body() dto: CreateExpenseCategoryDto, @Req() req: any) {
    return this.categoriesService.create(dto, req.user.tenantId);
  }

  @Patch(':id')
  @Permissions('expenses:manage_categories')
  update(@Param('id') id: string, @Body() dto: Partial<CreateExpenseCategoryDto>, @Req() req: any) {
    return this.categoriesService.update(id, dto, req.user.tenantId);
  }

  @Delete(':id')
  @Permissions('expenses:manage_categories')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.categoriesService.remove(id, req.user.tenantId);
  }
}
