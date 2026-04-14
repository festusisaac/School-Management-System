import { Controller, Post, Body, Get, Query, Param, Delete, Patch, Headers, UseGuards, Request, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Public } from '../../../decorators/public.decorator';
import { FeesService } from '../services/fees.service';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { CreateStructureDto } from '../dtos/create-structure.dto';
import { CreateDiscountDto } from '../dtos/create-discount.dto';
import { CreateReminderDto } from '../dtos/create-reminder.dto';
import { CarryForwardDto } from '../dtos/carry-forward.dto';
import { CreateFeeHeadDto } from '../dtos/create-fee-head.dto';
import { CreateFeeGroupDto } from '../dtos/create-fee-group.dto';
import { CreateDiscountProfileDto } from '../dtos/create-discount-profile.dto';
import { EntityManager } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { StudentsService } from '../../students/services/students.service';

import { BulkReminderDto } from '../dtos/bulk-reminder.dto';
import { UserRole } from '@common/dtos/auth.dto';
import { RolesGuard, JwtAuthGuard } from '@guards/jwt-auth.guard';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeesController {
  constructor(
    private readonly feesService: FeesService,
    private readonly studentsService: StudentsService,
    private readonly entityManager: EntityManager,
  ) { }

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
  verifyFlutterwavePayment(@Body() dto: { transactionId: string, meta: any, studentId: string, txRef?: string }, @Request() req: any) {
    return this.feesService.verifyFlutterwavePayment(dto.transactionId, dto.meta, dto.studentId, req.user.tenantId, dto.txRef);
  }

  // --- Payment Webhooks (No Auth Guard) ---
  @Public()
  @Post('paystack/webhook')
  async handlePaystackWebhook(@Headers('x-paystack-signature') signature: string, @Body() body: any) {
    return this.feesService.handlePaystackWebhook(signature, body);
  }

  @Public()
  @Post('flutterwave/webhook')
  async handleFlutterwaveWebhook(@Headers('verif-hash') hash: string, @Body() body: any) {
    return this.feesService.handleFlutterwaveWebhook(hash, body);
  }

  // --- Fees History ---
  @Get('payments')
  async payments(
    @Query('studentId') studentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('method') method?: any,
    @Query('type') type?: any,
    @Query('sectionId') sectionId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Request() req?: any
  ) {
    let resolvedStudentId: string | undefined = studentId;

    // Security scoping for students
    if (req.user.role === 'student' || req.user.role === 'Student') {
        const studentIdFromService = await this.studentsService.resolveStudentId(req.user.id, req.user.tenantId);
        if (!studentIdFromService) return [];
        resolvedStudentId = studentIdFromService;
    }

    return this.feesService.paymentHistory({ studentId: resolvedStudentId, startDate, endDate, method, type, sectionId, page, limit }, req.user.tenantId);
  }

  @Get('statement/:studentId')
  async getStatement(@Param('studentId') studentId: string, @Request() req: any) {
    const role = (req.user.role || '').toLowerCase();
    
    // Security scoping for parents
    if (role === 'parent') {
        const hasAccess = await this.entityManager.query(`
            SELECT 1 FROM students s 
            JOIN parents p ON p.id = s."parentId" 
            WHERE p."userId" = $1 AND s.id = $2 AND s."tenantId" = $3
        `, [req.user.id, studentId, req.user.tenantId]);
        
        if (!hasAccess || hasAccess.length === 0) {
            throw new ForbiddenException('You can only view your own children\'s fee statement.');
        }
        return this.feesService.getStudentStatement(studentId, req.user.tenantId);
    }

    // Security scoping for students
    if (role === 'student') {
        const resolvedStudentId = await this.studentsService.resolveStudentId(req.user.id, req.user.tenantId);
        if (!resolvedStudentId) throw new ForbiddenException('Student record linkage not found. Please contact administrator.');
        
        const student = await this.entityManager.getRepository(Student).findOne({
            where: { id: resolvedStudentId, tenantId: req.user.tenantId }
        });

        // Allow if student matches either the primary ID or the userId
        const isSelf = student && (student.id === studentId || student.userId === studentId);
        if (!isSelf) {
            throw new ForbiddenException('Security Block: You can only view your own fee statement.');
        }
        
        // Always use the internal student.id for the service call
        return this.feesService.getStudentStatement(student.id, req.user.tenantId);
    }
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
    @Query('sectionId') sectionId?: string,
    @Request() req?: any
  ) {
    return this.feesService.debtorsList({ classId, search, page, limit, minBalance, riskLevel, sectionId }, req.user.tenantId);
  }

  @Get('family/:studentId')
  async getFamilyFinancials(@Param('studentId') studentId: string, @Request() req: any) {
    const role = (req.user.role || '').toLowerCase();

    // Security scoping for parents
    if (role === 'parent') {
        const hasAccess = await this.entityManager.query(`
            SELECT 1 FROM students s 
            JOIN parents p ON p.id = s."parentId" 
            WHERE p."userId" = $1 AND s.id = $2 AND s."tenantId" = $3
        `, [req.user.id, studentId, req.user.tenantId]);
        
        if (!hasAccess || hasAccess.length === 0) {
            throw new ForbiddenException('You can only view your own family financials.');
        }
        return this.feesService.getFamilyFinancials(studentId, req.user.tenantId);
    }

    // Security scoping for students
    if (role === 'student') {
        const resolvedStudentId = await this.studentsService.resolveStudentId(req.user.id, req.user.tenantId);
        if (!resolvedStudentId) throw new ForbiddenException('Student record linkage not found. Please contact administrator.');
        
        const student = await this.entityManager.getRepository(Student).findOne({
            where: { id: resolvedStudentId, tenantId: req.user.tenantId }
        });

        // Allow if student matches either the primary ID or the userId
        const isSelf = student && (student.id === studentId || student.userId === studentId);
        if (!isSelf) {
            throw new ForbiddenException('Security Block: You can only view your own family financials.');
        }

        // Always use internal student.id
        return this.feesService.getFamilyFinancials(student.id, req.user.tenantId);
    }
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
  assignFeeGroupSimulation(@Param('id') id: string, @Body() dto: { classIds?: string[], sectionIds?: string[], categoryIds?: string[], studentIds?: string[] }, @Request() req: any) {
    return this.feesService.simulateBulkFeeAssignment(id, dto, req.user.tenantId);
  }

  @Post('students/:studentId/assign')
  assignFeesToStudent(@Param('studentId') studentId: string, @Body() dto: { feeGroupIds: string[], feeExclusions?: Record<string, string[]> }, @Request() req: any) {
    return this.feesService.assignFeesToStudent(studentId, dto.feeGroupIds, req.user.tenantId, dto.feeExclusions);
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

  @Post('carry-forward')
  carryForward(@Body() dto: CarryForwardDto, @Request() req: any) {
    return this.feesService.carryForward(dto, req.user.tenantId);
  }

  @Post('carry-forward/bulk')
  bulkCarryForward(@Body() dto: any, @Request() req: any) {
    return this.feesService.startBulkCarryForward(dto, req.user.tenantId);
  }

  @Get('carry-forward/job/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    const job = await (this.feesService as any).financeQueue.getJob(jobId);
    if (!job) throw new NotFoundException('Job not found');
    
    const state = await job.getState();
    const progress = job.progress();
    const result = job.returnvalue;
    const failedReason = job.failedReason;

    return {
      id: job.id,
      state,
      progress,
      result,
      failedReason
    };
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
