import { Controller, Post, Body, Get, Query, Param, Delete, Patch, Headers } from '@nestjs/common';
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

@Controller('finance')
export class FeesController {
  constructor(private readonly feesService: FeesService) { }

  // --- Offline Fees Collection ---
  @Post('record-payment')
  recordPayment(@Body() dto: CreatePaymentDto) {
    return this.feesService.recordPayment(dto);
  }

  // --- Online Payment Verification ---
  @Post('paystack/verify')
  verifyPaystackPayment(@Body() dto: { reference: string, meta: any, studentId: string }) {
    return this.feesService.verifyPaystackPayment(dto.reference, dto.meta, dto.studentId);
  }

  @Post('flutterwave/verify')
  verifyFlutterwavePayment(@Body() dto: { transactionId: string, meta: any, studentId: string }) {
    return this.feesService.verifyFlutterwavePayment(dto.transactionId, dto.meta, dto.studentId);
  }

  // --- Payment Webhooks ---
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
  ) {
    return this.feesService.paymentHistory({ studentId, startDate, endDate, method, type, page, limit });
  }

  @Get('statement/:studentId')
  getStatement(@Param('studentId') studentId: string) {
    return this.feesService.getStudentStatement(studentId);
  }

  @Post('payments/:id/refund')
  refundPayment(@Param('id') id: string, @Body('reason') reason: string) {
    return this.feesService.refundTransaction(id, reason);
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
  ) {
    return this.feesService.debtorsList({ classId, search, page, limit, minBalance, riskLevel });
  }

  @Get('family/:studentId')
  getFamilyFinancials(@Param('studentId') studentId: string) {
    return this.feesService.getFamilyFinancials(studentId);
  }

  // --- Fee Structure ---
  @Post('structures')
  createStructure(@Body() dto: CreateStructureDto) {
    return this.feesService.createStructure(dto);
  }

  @Get('structures')
  listStructures() {
    return this.feesService.listStructures();
  }

  // --- Fee Head Management ---
  @Post('heads')
  createHead(@Body() dto: CreateFeeHeadDto) {
    return this.feesService.createHead(dto);
  }

  @Get('heads')
  listHeads() {
    return this.feesService.listHeads();
  }

  @Delete('heads/:id')
  deleteHead(@Param('id') id: string) {
    return this.feesService.deleteHead(id);
  }

  @Patch('heads/:id')
  updateHead(@Param('id') id: string, @Body() dto: Partial<CreateFeeHeadDto>) {
    return this.feesService.updateHead(id, dto);
  }

  // --- Fee Group Management ---
  @Post('groups')
  createGroup(@Body() dto: CreateFeeGroupDto) {
    return this.feesService.createGroup(dto);
  }

  @Get('groups')
  listGroups() {
    return this.feesService.listGroups();
  }

  @Delete('groups/:id')
  deleteGroup(@Param('id') id: string) {
    return this.feesService.deleteGroup(id);
  }

  @Patch('groups/:id')
  updateGroup(@Param('id') id: string, @Body() dto: Partial<CreateFeeGroupDto>) {
    return this.feesService.updateGroup(id, dto);
  }

  @Post('groups/:id/assign')
  assignGroupBulk(@Param('id') id: string, @Body() dto: { classIds?: string[], sectionIds?: string[], categoryIds?: string[], studentIds?: string[], excludeIds?: string[] }) {
    return this.feesService.bulkAssignFeeGroup(id, dto);
  }

  @Post('groups/:id/simulate')
  simulateGroupBulk(@Param('id') id: string, @Body() dto: { classIds?: string[], sectionIds?: string[], categoryIds?: string[], studentIds?: string[] }) {
    return this.feesService.simulateBulkFeeAssignment(id, dto);
  }


  // --- Discounts ---
  @Post('discounts')
  createDiscount(@Body() dto: CreateDiscountDto) {
    return this.feesService.createDiscount(dto);
  }

  @Get('discounts')
  listDiscounts() {
    return this.feesService.listDiscounts();
  }

  // --- Advanced Discount Management ---
  @Post('discount-profiles')
  createDiscountProfile(@Body() dto: CreateDiscountProfileDto) {
    return this.feesService.createDiscountProfile(dto);
  }

  @Get('discount-profiles')
  listDiscountProfiles() {
    return this.feesService.listDiscountProfiles();
  }

  @Delete('discount-profiles/:id')
  deleteDiscountProfile(@Param('id') id: string) {
    return this.feesService.deleteDiscountProfile(id);
  }

  @Patch('discount-profiles/:id')
  updateDiscountProfile(@Param('id') id: string, @Body() dto: CreateDiscountProfileDto) {
    return this.feesService.updateDiscountProfile(id, dto);
  }

  @Get('discount-profiles/:id')
  getDiscountProfile(@Param('id') id: string) {
    return this.feesService.getDiscountProfile(id);
  }

  @Post('discount-profiles/:id/assign')
  assignDiscountProfile(@Param('id') id: string, @Body() dto: { classIds?: string[], sectionIds?: string[], categoryIds?: string[], studentIds?: string[], excludeIds?: string[] }) {
    return this.feesService.assignDiscountProfile(id, dto);
  }

  @Post('discount-profiles/:id/simulate')
  simulateDiscountProfile(@Param('id') id: string, @Body() dto: { classIds?: string[], sectionIds?: string[], categoryIds?: string[], studentIds?: string[] }) {
    return this.feesService.simulateDiscountAssignment(dto);
  }

  // --- Payment Reminders ---
  @Post('reminders')
  createReminder(@Body() dto: CreateReminderDto) {
    return this.feesService.createReminder(dto);
  }

  @Post('reminders/bulk')
  sendBulkReminders(@Body() dto: BulkReminderDto) {
    return this.feesService.sendBulkReminders(dto);
  }

  @Get('reminders')
  listReminders(
    @Query('studentId') studentId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.feesService.listReminders({ studentId, page, limit });
  }

  // --- Balance Carry-Forward ---
  @Post('carry-forward')
  carryForward(@Body() dto: CarryForwardDto) {
    return this.feesService.carryForward(dto);
  }

  @Get('carry-forward')
  listCarryForwards(
    @Query('studentId') studentId?: string,
    @Query('academicYear') academicYear?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.feesService.listCarryForwards({ studentId, academicYear, page, limit });
  }

  @Delete('carry-forward/:id')
  deleteCarryForward(@Param('id') id: string) {
    return this.feesService.deleteCarryForward(id);
  }
}
