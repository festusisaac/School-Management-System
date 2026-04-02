import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Staff } from '../../hr/entities/staff.entity';
import { MessageTemplate } from '../entities/message-template.entity';
import { CommunicationLog, CommunicationType, CommunicationStatus } from '../entities/communication-log.entity';
import { EmailService } from '../../internal-communication/email.service';
import { SmsService } from '../../internal-communication/sms.service';
import { FeesService } from '../../finance/services/fees.service';
import { SystemSettingsService } from '../../system/services/system-settings.service';
import { SendBroadcastDto, BroadcastTarget } from '../dto/send-broadcast.dto';

@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);

  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    @InjectRepository(MessageTemplate)
    private readonly templateRepository: Repository<MessageTemplate>,
    @InjectRepository(CommunicationLog)
    private readonly logRepository: Repository<CommunicationLog>,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly feesService: FeesService,
    private readonly systemSettingsService: SystemSettingsService,
  ) {}

  async broadcast(dto: SendBroadcastDto, tenantId: string): Promise<{ queued: number }> {
    this.logger.log(`Starting broadcast: ${dto.target} via ${dto.channel}`);

    // 1. Resolve Recipients
    const recipients = await this.resolveRecipients(dto, tenantId);
    this.logger.log(`Resolved ${recipients.length} recipients for broadcast.`);

    if (recipients.length === 0) {
      return { queued: 0 };
    }

    // 2. Schedule and Queue
    let queuedCount = 0;
    const now = Date.now();
    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    const delay = (scheduledAt && scheduledAt.getTime() > now) ? scheduledAt.getTime() - now : 0;
    const status = delay > 0 ? CommunicationStatus.SCHEDULED : CommunicationStatus.SENT;

    for (const recipient of recipients) {
      const personalizedBody = await this.replacePlaceholders(dto.body, recipient, tenantId);
      const personalizedSubject = dto.subject ? await this.replacePlaceholders(dto.subject, recipient, tenantId) : undefined;

      const data = recipient.data;

      // Log the attempt
      const log = this.logRepository.create({
        type: dto.channel as CommunicationType,
        recipient: dto.channel === 'EMAIL' ? recipient.email : recipient.phone,
        recipientName: recipient.name,
        subject: personalizedSubject,
        body: personalizedBody,
        status,
        tenantId,
        studentId: data?.admissionNo ? data.id : undefined, // Heuristic: students have admissionNo
        staffId: data?.employeeId ? data.id : undefined,   // Heuristic: staff have employeeId
        scheduledAt: scheduledAt || undefined,
      });
      await this.logRepository.save(log);

      // Queue the actual message
      if (dto.channel === 'EMAIL' && recipient.email) {
        await this.emailService.sendEmail({
          to: recipient.email,
          subject: personalizedSubject || 'School Notification',
          html: personalizedBody,
          logId: log.id,
        }, delay);
        queuedCount++;
      } else if (dto.channel === 'SMS' && recipient.phone) {
        await this.smsService.sendSms({
          to: recipient.phone,
          message: personalizedBody,
          logId: log.id,
        }, delay);
        queuedCount++;
      }
    }

    return { queued: queuedCount };
  }

  private async resolveRecipients(dto: SendBroadcastDto, tenantId: string): Promise<any[]> {
    const recipients: any[] = [];

    switch (dto.target) {
      case BroadcastTarget.ALL_STUDENTS:
        const students = await this.studentRepository.find({ where: { tenantId, isActive: true }, relations: ['class', 'parent'] });
        students.forEach(s => recipients.push(...this.extractStudentTarget(s, dto.includeParents)));
        break;

      case BroadcastTarget.CLASS:
        if (dto.targetIds?.length) {
          const classStudents = await this.studentRepository.find({
            where: { tenantId, isActive: true, classId: In(dto.targetIds) },
            relations: ['class', 'parent']
          });
          classStudents.forEach(s => recipients.push(...this.extractStudentTarget(s, dto.includeParents)));
        }
        break;

      case BroadcastTarget.SECTION:
        if (dto.targetIds?.length) {
          const sectionStudents = await this.studentRepository.find({
            where: { tenantId, isActive: true, sectionId: In(dto.targetIds) },
            relations: ['class', 'parent']
          });
          sectionStudents.forEach(s => recipients.push(...this.extractStudentTarget(s, dto.includeParents)));
        }
        break;

      case BroadcastTarget.STAFF:
        const staff = await this.staffRepository.find({ where: { tenantId, status: 'ACTIVE' as any } });
        staff.forEach(st => recipients.push({
          name: `${st.firstName} ${st.lastName}`,
          email: st.email,
          phone: st.phone,
          data: st
        }));
        break;

      case BroadcastTarget.INDIVIDUAL_STUDENTS:
        if (dto.targetIds?.length) {
          const indStudents = await this.studentRepository.find({
            where: { tenantId, id: In(dto.targetIds) },
            relations: ['class', 'parent']
          });
          indStudents.forEach(s => recipients.push(...this.extractStudentTarget(s, dto.includeParents)));
        }
        break;

      case BroadcastTarget.INDIVIDUAL_STAFF:
          if (dto.targetIds?.length) {
            const indStaff = await this.staffRepository.find({
              where: { tenantId, id: In(dto.targetIds) }
            });
            indStaff.forEach(st => recipients.push({
              name: `${st.firstName} ${st.lastName}`,
              email: st.email,
              phone: st.phone,
              data: st
            }));
          }
          break;

      case BroadcastTarget.DEBTORS_ONLY:
          const debtorsResult = await this.feesService.debtorsList({ limit: 1000 }, tenantId);
          debtorsResult.items.forEach(d => {
            recipients.push(...this.extractStudentTarget(d.student, dto.includeParents));
          });
          break;

      case BroadcastTarget.PAID_ONLY:
          // Logic: Get ALL students, then filter out those in the debtors list
          const allStudents = await this.studentRepository.find({ where: { tenantId, isActive: true }, relations: ['class', 'parent'] });
          const debtors = await this.feesService.debtorsList({ limit: 1000 }, tenantId);
          const debtorIds = new Set(debtors.items.map(d => d.id));
          
          allStudents.filter(s => !debtorIds.has(s.id)).forEach(s => {
            recipients.push(...this.extractStudentTarget(s, dto.includeParents));
          });
          break;
    }

    // Filter out duplicates and missing contact info
    const uniqueMap = new Map();
    recipients.forEach(r => {
      const key = `${r.email}|${r.phone}`;
      if (!uniqueMap.has(key) && (r.email || r.phone)) {
        uniqueMap.set(key, r);
      }
    });

    return Array.from(uniqueMap.values());
  }

  private extractStudentTarget(student: Student, includeParents?: boolean): any[] {
    const targets = [];
    // Student themselves
    targets.push({
      name: `${student.firstName} ${student.lastName || ''}`,
      email: student.email,
      phone: student.mobileNumber,
      data: student
    });

    // Parents/Guardians if requested
    if (includeParents && student.parent) {
      if (student.parent.guardianEmail || student.parent.guardianPhone) {
        targets.push({
          name: student.parent.guardianName || 'Guardian',
          email: student.parent.guardianEmail,
          phone: student.parent.guardianPhone,
          data: student // We still keep student data for placeholders
        });
      }
    }
    return targets;
  }

  private async replacePlaceholders(text: string, recipient: any, tenantId: string): Promise<string> {
    let result = text;
    const data = recipient.data;
    const settings = await this.systemSettingsService.getSettings();

    // Determine the name to use in 'Dear {name}'
    const displayName = data.firstName 
      ? data.firstName 
      : (recipient.name && recipient.name !== 'Guardian' ? recipient.name : 'Recipient');

    const placeholders: Record<string, string> = {
      '{name}': displayName,
      '{student_name}': data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : (recipient.name || 'Recipient'),
      '{first_name}': data.firstName || (recipient.name?.split(' ')[0]) || 'Recipient',
      '{last_name}': data.lastName || '',
      '{full_name}': data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : (recipient.name || 'Recipient'),
      '{admission_no}': data.admissionNo || '',
      '{admission_number}': data.admissionNo || '',
      '{class_name}': data.class?.name || '',
      '{guardian_name}': data.parent?.guardianName || 'Guardian',
      '{school_name}': settings.schoolName || 'Our School',
    };

    // Dynamic Balance resolution if placeholder exists
    if (text.includes('{fee_balance}') && data.id) {
      try {
        const balance = await this.feesService.getStudentCurrentBalance(data.id, tenantId);
        const symbol = settings.currencySymbol || '₦';
        placeholders['{fee_balance}'] = `${symbol}${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      } catch (err) {
        placeholders['{fee_balance}'] = '0.00';
      }
    }

    // Replace placeholders
    for (const [key, value] of Object.entries(placeholders)) {
      result = result.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    }

    return result;
  }

  async getLogs(tenantId: string, params?: { type?: string; status?: string; limit?: number; page?: number }): Promise<any[]> {
    const query = this.logRepository.createQueryBuilder('log')
      .where('log.tenantId = :tenantId', { tenantId })
      .orderBy('log.createdAt', 'DESC');

    if (params?.type) {
      query.andWhere('log.type = :type', { type: params.type });
    }

    if (params?.status) {
      query.andWhere('log.status = :status', { status: params.status });
    }

    if (params?.limit) {
      const page = params.page && params.page > 0 ? params.page : 1;
      query.skip((page - 1) * params.limit).take(params.limit);
    } else {
      query.take(100); // Default limit
    }

    return await query.getMany();
  }

  async getLogsByStudent(studentId: string, tenantId: string): Promise<any[]> {
    return await this.logRepository.find({
      where: { studentId, tenantId },
      order: { createdAt: 'DESC' },
      take: 50
    });
  }
}
