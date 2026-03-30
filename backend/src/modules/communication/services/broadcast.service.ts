import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Staff } from '../../hr/entities/staff.entity';
import { MessageTemplate } from '../entities/message-template.entity';
import { CommunicationLog, CommunicationType, CommunicationStatus } from '../entities/communication-log.entity';
import { EmailService } from '../../internal-communication/email.service';
import { SmsService } from '../../internal-communication/sms.service';
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
  ) {}

  async broadcast(dto: SendBroadcastDto, tenantId: string): Promise<{ queued: number }> {
    this.logger.log(`Starting broadcast: ${dto.target} via ${dto.channel}`);

    // 1. Resolve Recipients
    const recipients = await this.resolveRecipients(dto, tenantId);
    this.logger.log(`Resolved ${recipients.length} recipients for broadcast.`);

    if (recipients.length === 0) {
      return { queued: 0 };
    }

    // 2. Process and Queue
    let queuedCount = 0;
    for (const recipient of recipients) {
      const personalizedBody = this.replacePlaceholders(dto.body, recipient);
      const personalizedSubject = dto.subject ? this.replacePlaceholders(dto.subject, recipient) : undefined;

      // Log the attempt
      const log = this.logRepository.create({
        type: dto.channel as CommunicationType,
        recipient: dto.channel === 'EMAIL' ? recipient.email : recipient.phone,
        recipientName: recipient.name,
        subject: personalizedSubject,
        body: personalizedBody,
        status: CommunicationStatus.SENT, // We mark as SENT once queued successfully
        tenantId,
      });
      await this.logRepository.save(log);

      // Queue the actual message
      if (dto.channel === 'EMAIL' && recipient.email) {
        await this.emailService.sendEmail({
          to: recipient.email,
          subject: personalizedSubject || 'School Notification',
          html: personalizedBody,
        });
        queuedCount++;
      } else if (dto.channel === 'SMS' && recipient.phone) {
        await this.smsService.sendSms(recipient.phone, personalizedBody);
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

  private replacePlaceholders(text: string, recipient: any): string {
    let result = text;
    const data = recipient.data;

    const placeholders: Record<string, string> = {
      '{student_name}': data.firstName ? `${data.firstName} ${data.lastName || ''}` : recipient.name,
      '{admission_no}': data.admissionNo || '',
      '{class_name}': data.class?.name || '',
      '{guardian_name}': data.parent?.guardianName || '',
      '{school_name}': 'Our School', // Should fetch from settings
    };

    for (const [key, value] of Object.entries(placeholders)) {
      result = result.replace(new RegExp(key, 'g'), value);
    }

    return result;
  }
}
