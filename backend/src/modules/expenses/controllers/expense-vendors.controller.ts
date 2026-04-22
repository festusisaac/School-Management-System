import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { PermissionsGuard } from '@guards/permissions.guard';
import { Permissions } from '@decorators/permissions.decorator';
import { CreateExpenseVendorDto } from '../dto/create-expense-vendor.dto';
import { ExpenseVendorsService } from '../services/expense-vendors.service';

@Controller('expenses/vendors')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ExpenseVendorsController {
  constructor(private readonly vendorsService: ExpenseVendorsService) {}

  @Get()
  @Permissions('expenses:view')
  findAll(@Req() req: any) {
    return this.vendorsService.findAll(req.user.tenantId);
  }

  @Post()
  @Permissions('expenses:manage_vendors')
  create(@Body() dto: CreateExpenseVendorDto, @Req() req: any) {
    return this.vendorsService.create(dto, req.user.tenantId);
  }

  @Patch(':id')
  @Permissions('expenses:manage_vendors')
  update(@Param('id') id: string, @Body() dto: Partial<CreateExpenseVendorDto>, @Req() req: any) {
    return this.vendorsService.update(id, dto, req.user.tenantId);
  }

  @Delete(':id')
  @Permissions('expenses:manage_vendors')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.vendorsService.remove(id, req.user.tenantId);
  }
}
