import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { FeesService } from '../services/fees.service';
import { EmailService } from '../../internal-communication/email.service';
import { SmsService } from '../../internal-communication/sms.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Parent } from '../../students/entities/parent.entity';
import { AcademicSession } from '../../system/entities/academic-session.entity';

@Processor('finance')
export class FinanceProcessor {
  private readonly logger = new Logger(FinanceProcessor.name);

  constructor(
    private readonly feesService: FeesService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(AcademicSession)
    private readonly sessionRepo: Repository<AcademicSession>,
  ) {}

  @Process('bulk-carry-forward')
  async handleBulkCarryForward(job: Job<any>) {
    let { oldSessionId, newSessionId, oldSessionName, newSessionName, tenantId } = job.data;
    this.logger.log(`Starting bulk carry forward from ${oldSessionName || oldSessionId} to ${newSessionName || newSessionId}`);

    // Resolve sessions if only names provided
    if (!newSessionId && newSessionName) {
        let session = await this.sessionRepo.findOne({ where: { name: newSessionName } });
        if (!session) {
            session = await this.sessionRepo.createQueryBuilder('s')
                .where('TRIM(s.name) = :name', { name: newSessionName.trim() })
                .orWhere('s.name ILIKE :name', { name: newSessionName.trim() })
                .getOne();
        }
        if (session) newSessionId = session.id;
    }

    if (!oldSessionId && oldSessionName) {
        let session = await this.sessionRepo.findOne({ where: { name: oldSessionName } });
        if (!session) {
            session = await this.sessionRepo.createQueryBuilder('s')
                .where('TRIM(s.name) = :name', { name: oldSessionName.trim() })
                .orWhere('s.name ILIKE :name', { name: oldSessionName.trim() })
                .getOne();
        }
        if (session) oldSessionId = session.id;
    }

    const students = await this.studentRepo.find({ 
        where: { isActive: true, tenantId },
        relations: ['parent'] 
    });

    const total = students.length;
    let processed = 0;
    let skipped = 0;

    // Grouping for consolidated notifications
    const parentAlerts = new Map<string, { 
        parent: Parent, 
        children: { name: string, amount: string }[] 
    }>();

    for (let i = 0; i < students.length; i++) {
        const student = students[i];
        try {
            const result = await this.feesService.carryForward({
                studentId: student.id,
                academicYear: newSessionName || 'Next Session',
                sessionId: newSessionId,
                oldSessionId: oldSessionId
            }, tenantId);

            if (parseFloat(result.totalAmount) > 0) {
                processed++;
                
                // Add to parent notification group
                if (student.parent) {
                    const existing = parentAlerts.get(student.parentId!) || { parent: student.parent, children: [] };
                    existing.children.push({ 
                        name: `${student.firstName} ${student.lastName}`, 
                        amount: result.totalAmount 
                    });
                    parentAlerts.set(student.parentId!, existing);
                }
            } else {
                skipped++;
            }
        } catch (error: any) {
            this.logger.error(`Error processing student ${student.admissionNo}: ${error.message}`);
            skipped++;
        }

        // Update job progress
        await job.progress(Math.round(((i + 1) / total) * 100));
    }

    // Send Consolidated Notifications
    this.logger.log(`Processing complete. Sending ${parentAlerts.size} consolidated notifications...`);
    for (const [_, alert] of parentAlerts) {
        try {
            const parentName = alert.parent.fatherName || alert.parent.motherName || alert.parent.guardianName || 'Parent';
            const parentEmail = alert.parent.fatherEmail || alert.parent.motherEmail || alert.parent.guardianEmail;
            const parentPhone = alert.parent.fatherPhone || alert.parent.motherPhone || alert.parent.guardianPhone;

            const studentListStr = alert.children.map(c => `${c.name} (Amount: ${c.amount})`).join(', ');
            const message = `Dear ${parentName}, the balance for your child(ren) [${studentListStr}] has been carried forward to the ${newSessionName || 'New'} session. This serves as your opening balance for the session. Thank you!`;

            if (parentEmail) {
                await this.emailService.sendNotificationEmail(
                    parentEmail, 
                    'Balance Carry Forward Notice', 
                    message, 
                    'Important: Opening Balance Notification'
                );
            }

            if (parentPhone) {
                await this.smsService.sendNotificationSms(parentPhone, message);
            }
        } catch (error: any) {
            this.logger.error(`Failed to send notification to parent: ${error.message}`);
        }
    }

    return { total, processed, skipped };
  }

  @Process('export-statement-report')
  async handleStatementReport(job: Job<{ studentId: string; tenantId: string }>) {
    await job.progress(15);
    const payload = await this.feesService.buildStatementReportPayload(job.data.studentId, job.data.tenantId);
    await job.progress(100);
    return payload;
  }

  @Process('export-fee-history-report')
  async handleFeeHistoryReport(job: Job<any>) {
    await job.progress(10);
    const payload = await this.feesService.buildFeeHistoryReportPayload({
      studentId: job.data.studentId,
      startDate: job.data.startDate,
      endDate: job.data.endDate,
      method: job.data.method,
      type: job.data.type,
      sectionId: job.data.sectionId,
    }, job.data.tenantId);
    await job.progress(100);
    return payload;
  }
}
