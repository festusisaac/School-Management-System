import { Controller, Post, Body, Get, Query, Param, Delete, Patch, Headers, UseGuards, Request } from '@nestjs/common';
import { FeesService } from '../services/fees.service';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { CreateStructureDto } from '../dtos/create-structure.dto';
import { CreateDiscountDto } from '../dtos/create-discount.dto';
import { CreateReminderDto } from '../dtos/create-reminder.dto';
import { CarryForwardDto } from '../dtos/carry-forward.dto';
import { CreateFeeHeadDto } from '../dtos/create-fee-head.dto';
import { CreateFeeGroupDto } from '../dtos/create-fee-group.dto';
import { CreateDiscountProfileDto } from '../dtos/create-discount-profile.dto';

import { BulkReminderDto } from '../dtos/bulk-reminder.dto';

import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FeesController {
  constructor(private readonly feesService: FeesService) { }

  // --- Offline Fees Collection ---
  @Post('record-payment')
  recordPayment(@Body() dto: CreatePaymentDto, @Request() req: any) {
    return this.feesService.recordPayment(dto, req.user.tenantId);
  }

  // --- Online Payment Verification ---
  @Post('paystack/verify')
  verifyPaystackPayment(@Body() dto: { reference: string, meta: any, studentId: string }, @Request() req: any) {
    return this.feesService.verifyPaystackPayment(dto.reference, dto.meta, dto.studentId, req.user.tenantId);
  }

  @Post('flutterwave/verify')
  verifyFlutterwavePayment(@Body() dto: { transactionId: string, meta: any, studentId: string }, @Request() req: any) {
    return this.feesService.verifyFlutterwavePayment(dto.transactionId, dto.meta, dto.studentId, req.user.tenantId);
  }

  // --- Payment Webhooks (No Auth Guard) ---
  @Post('paystack/webhook')
  async handlePaystackWebhook(@Headers('x-paystack-signature') signature: string, @Body() body: any) {
    return this.feesService.handlePaystackWebhook(signature, body);
  }

  @Post('flutterwave/webhook')
  async handleFlutterwaveWebhook(@Headers('verif-hash') hash: string, @Body() body: any) {
    return this.feesService.handleFlutterwaveWebhook(hash, body);
  }

  // --- Fees History ---
  @Get('payments')
  payments(
    @Query('studentId') studentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('method') method?: any,
    @Query('type') type?: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Request() req?: any
  ) {
    return this.feesService.paymentHistory({ studentId, startDate, endDate, method, type, page, limit }, req.user.tenantId);
  }

  @Get('statement/:studentId')
  getStatement(@Param('studentId') studentId: string, @Request() req: any) {
    return this.feesService.getStudentStatement(studentId, req.user.tenantId);
  }

  @Post('payments/:id/refund')
  refundPayment(@Param('id') id: string, @Body('reason') reason: string, @Request() req: any) {
    return this.feesService.refundTransaction(id, reason, req.user.tenantId);
  }

  // --- Debtors List ---
  @Get('debtors')
  debtors(
    @Query('classId') classId?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('minBalance') minBalance?: number,
    @Query('riskLevel') riskLevel?: string,
    @Request() req?: any
  ) {
    return this.feesService.debtorsList({ classId, search, page, limit, minBalance, riskLevel }, req.user.tenantId);
  }

  @Get('family/:studentId')
  getFamilyFinancials(@Param('studentId') studentId: string, @Request() req: any) {
    return this.feesService.getFamilyFinancials(studentId, req.user.tenantId);
  }

  // --- Fee Structure ---
  @Post('structures')
  createStructure(@Body() dto: CreateStructureDto, @Request() req: any) {
    return this.feesService.createStructure(dto, req.user.tenantId);
  }

  @Get('structures')
  listStructures(@Request() req: any) {
    return this.feesService.listStructures(req.user.tenantId);
  }

  // --- Fee Head Management ---
  @Post('heads')
  createHead(@Body() dto: CreateFeeHeadDto, @Request() req: any) {
    return this.feesService.createHead(dto, req.user.tenantId);
  }

  @Get('heads')
  listHeads(@Request() req: any) {
    return this.feesService.listHeads(req.user.tenantId);
  }

  @Delete('heads/:id')
  deleteHead(@Param('id') id: string, @Request() req: any) {
    return this.feesService.deleteHead(id, req.user.tenantId);
  }

  @Patch('heads/:id')
  updateHead(@Param('id') id: string, @Body() dto: Partial<CreateFeeHeadDto>, @Request() req: any) {
    return this.feesService.updateHead(id, dto, req.user.tenantId);
  }

  // --- Fee Group Management ---
  @Post('groups')
  createGroup(@Body() dto: CreateFeeGroupDto, @Request() req: any) {
    return this.feesService.createGroup(dto, req.user.tenantId);
  }

  @Get('groups')
  listGroups(@Request() req: any) {
    return this.feesService.listGroups(req.user.tenantId);
  }

  @Delete('groups/:id')
  deleteGroup(@Param('id') id: string, @Request() req: any) {
    return this.feesService.deleteGroup(id, req.user.tenantId);
  }

  @Patch('groups/:id')
  updateGroup(@Param('id') id: string, @Body() dto: Partial<CreateFeeGroupDto>, @Request() req: any) {
    return this.feesService.updateGroup(id, dto, req.user.tenantId);
  }

  @Post('groups/:id/assign')
  assignGroupBulk(@Param('id') id: string, @Body() dto: { classIds?: string[], sectionIds?: string[], categoryIds?: string[], studentIds?: string[], excludeIds?: string[] }, @Request() req: any) {
    return this.feesService.bulkAssignFeeGroup(id, dto, req.user.tenantId);
  }

  @Post('groups/:id/simulate')
  simulateGroupBulk(@Param('id') id: string, @Body() dto: { classIds?: string[], sectionIds?: string[], categoryIds?: string[], studentIds?: string[] }, @Request() req: any) {
    return this.feesService.simulateBulkFeeAssignment(id, dto, req.user.tenantId);
  }


  // --- Discounts ---
  @Post('discounts')
  createDiscount(@Body() dto: CreateDiscountDto, @Request() req: any) {
    return this.feesService.createDiscount(dto, req.user.tenantId);
  }

  @Get('discounts')
  listDiscounts(@Request() req: any) {
    return this.feesService.listDiscounts(req.user.tenantId);
  }

  // --- Advanced Discount Management ---
  @Post('discount-profiles')
  createDiscountProfile(@Body() dto: CreateDiscountProfileDto, @Request() req: any) {
    return this.feesService.createDiscountProfile(dto, req.user.tenantId);
  }

  @Get('discount-profiles')
  listDiscountProfiles(@Request() req: any) {
    return this.feesService.listDiscountProfiles(req.user.tenantId);
  }

  @Delete('discount-profiles/:id')
  deleteDiscountProfile(@Param('id') id: string, @Request() req: any) {
    return this.feesService.deleteDiscountProfile(id, req.user.tenantId);
  }

  @Patch('discount-profiles/:id')
  updateDiscountProfile(@Param('id') id: string, @Body() dto: CreateDiscountProfileDto, @Request() req: any) {
    return this.feesService.updateDiscountProfile(id, dto, req.user.tenantId);
  }

  @Get('discount-profiles/:id')
  getDiscountProfile(@Param('id') id: string, @Request() req: any) {
    return this.feesService.getDiscountProfile(id, req.user.tenantId);
  }

  @Post('discount-profiles/:id/assign')
  assignDiscountProfile(@Param('id') id: string, @Body() dto: { classIds?: string[], sectionIds?: string[], categoryIds?: string[], studentIds?: string[], excludeIds?: string[] }, @Request() req: any) {
    return this.feesService.assignDiscountProfile(id, dto, req.user.tenantId);
  }

  @Post('discount-profiles/:id/simulate')
  simulateDiscountProfile(@Param('id') id: string, @Body() dto: { classIds?: string[], sectionIds?: string[], categoryIds?: string[], studentIds?: string[] }, @Request() req: any) {
    return this.feesService.simulateDiscountAssignment(dto, req.user.tenantId);
  }

  // --- Payment Reminders ---
  @Post('reminders')
  createReminder(@Body() dto: CreateReminderDto, @Request() req: any) {
    return this.feesService.createReminder(dto, req.user.tenantId);
  }

  @Post('reminders/bulk')
  sendBulkReminders(@Body() dto: BulkReminderDto, @Request() req: any) {
    return this.feesService.sendBulkReminders(dto, req.user.tenantId);
  }

  @Get('reminders')
  listReminders(
    @Query('studentId') studentId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Request() req?: any
  ) {
    return this.feesService.listReminders({ studentId, page, limit }, req.user.tenantId);
  }

  // --- Balance Carry-Forward ---
  @Post('carry-forward')
  carryForward(@Body() dto: CarryForwardDto, @Request() req: any) {
    return this.feesService.carryForward(dto, req.user.tenantId);
  }

  @Get('carry-forward')
  listCarryForwards(
    @Query('studentId') studentId?: string,
    @Query('academicYear') academicYear?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Request() req?: any
  ) {
    return this.feesService.listCarryForwards({ studentId, academicYear, page, limit }, req.user.tenantId);
  }

  @Delete('carry-forward/:id')
  deleteCarryForward(@Param('id') id: string, @Request() req: any) {
    return this.feesService.deleteCarryForward(id, req.user.tenantId);
  }
}
