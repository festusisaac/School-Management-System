import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Alumni } from '../entities/alumni.entity';
import { AlumniEvent } from '../entities/alumni-event.entity';
import { AlumniAttendee } from '../entities/alumni-attendee.entity';
import { CreateAlumniDto, UpdateAlumniDto, GraduateStudentDto, BulkGraduateStudentsDto, CreateAlumniEventDto, UpdateAlumniEventDto } from '../dtos/alumni.dto';
import { Student } from '../../students/entities/student.entity';
import { User } from '../../auth/entities/user.entity';
import { StudentsService } from '../../students/services/students.service';
import { BroadcastService } from '../../communication/services/broadcast.service';
import { BroadcastTarget } from '../../communication/dto/send-broadcast.dto';

@Injectable()
export class AlumniService {
  constructor(
    @InjectRepository(Alumni)
    private alumniRepository: Repository<Alumni>,
    @InjectRepository(AlumniEvent)
    private eventRepository: Repository<AlumniEvent>,
    @InjectRepository(AlumniAttendee)
    private attendeeRepository: Repository<AlumniAttendee>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private studentsService: StudentsService,
    private broadcastService: BroadcastService,
  ) {}

  async create(dto: CreateAlumniDto, tenantId: string): Promise<Alumni> {
    if (dto.studentId) {
      const existing = await this.alumniRepository.findOne({ where: { studentId: dto.studentId, tenantId } });
      if (existing) {
        throw new ConflictException('This student is already registered as an alumnus');
      }
    }

    const alumni = this.alumniRepository.create({
      ...dto,
      tenantId,
    });
    return this.alumniRepository.save(alumni);
  }

  async findAll(tenantId: string): Promise<Alumni[]> {
    return this.alumniRepository.find({
      where: { tenantId },
      relations: ['student'],
      order: { graduationYear: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Alumni> {
    const alumni = await this.alumniRepository.findOne({
      where: { id, tenantId },
      relations: ['student'],
    });
    if (!alumni) throw new NotFoundException(`Alumni with ID ${id} not found`);
    return alumni;
  }

  async findByEmail(email: string, tenantId: string): Promise<Alumni | null> {
    return this.alumniRepository.findOne({ where: { email, tenantId } });
  }

  async update(id: string, dto: UpdateAlumniDto, tenantId: string): Promise<Alumni> {
    const alumni = await this.findOne(id, tenantId);
    Object.assign(alumni, dto);
    return this.alumniRepository.save(alumni);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const alumni = await this.findOne(id, tenantId);
    // Remove related attendee records first to avoid FK constraint violation
    await this.attendeeRepository.delete({ alumniId: id });
    await this.alumniRepository.remove(alumni);
  }

  async graduateStudent(dto: GraduateStudentDto, tenantId: string): Promise<Alumni> {
    const student = await this.studentRepository.findOne({ 
      where: { id: dto.studentId, tenantId },
      relations: ['user', 'parent']
    });
    if (!student) throw new NotFoundException('Student not found');

    const existing = await this.alumniRepository.findOne({ where: { studentId: dto.studentId, tenantId } });
    if (existing) throw new ConflictException('Student is already an alumnus');

    // Create alumni record with parent contact fallback
    const alumni = this.alumniRepository.create({
      studentId: student.id,
      graduationYear: dto.graduationYear,
      currentOccupation: dto.currentOccupation,
      currentCompany: dto.currentCompany,
      email: student.email || student.parent?.fatherEmail || student.parent?.motherEmail || student.parent?.guardianEmail,
      phoneNumber: student.mobileNumber || student.parent?.fatherPhone || student.parent?.motherPhone || student.parent?.guardianPhone,
      address: student.currentAddress || student.parent?.permanentAddress,
      isMentorshipAvailable: dto.isMentorshipAvailable,
      adminNotes: dto.adminNotes,
      tenantId,
    });

    const savedAlumni = await this.alumniRepository.save(alumni);

    // Deactivate student record and linked user account
    await this.studentsService.deactivate(student.id, tenantId);

    return savedAlumni;
  }

  async bulkGraduate(dto: BulkGraduateStudentsDto, tenantId: string): Promise<{ graduated: number; skipped: number }> {
    const students = await this.studentRepository.find({
      where: { id: In(dto.studentIds), tenantId },
      relations: ['parent'],
    });

    let graduated = 0;
    let skipped = 0;

    for (const student of students) {
      const existing = await this.alumniRepository.findOne({ where: { studentId: student.id, tenantId } });
      if (existing) {
        skipped++;
        continue;
      }

      const alumni = this.alumniRepository.create({
        studentId: student.id,
        graduationYear: dto.graduationYear,
        email: student.email || student.parent?.fatherEmail || student.parent?.motherEmail || student.parent?.guardianEmail,
        phoneNumber: student.mobileNumber || student.parent?.fatherPhone || student.parent?.motherPhone || student.parent?.guardianPhone,
        address: student.currentAddress || student.parent?.permanentAddress,
        tenantId,
      });

      await this.alumniRepository.save(alumni);

      try {
        await this.studentsService.deactivate(student.id, tenantId);
      } catch (e) {
        // Student may already be deactivated — continue
      }

      graduated++;
    }

    return { graduated, skipped };
  }

  async getFeaturedAlumni(tenantId?: string): Promise<Alumni[]> {
    let effectiveTenantId = tenantId;
    
    if (!effectiveTenantId) {
      // For public requests, attempt to find the first tenantId available
      const firstAlumnus = await this.alumniRepository.findOne({ where: {} });
      if (!firstAlumnus) return [];
      effectiveTenantId = firstAlumnus.tenantId;
    }

    return this.alumniRepository.find({
      where: { isFeatured: true, tenantId: effectiveTenantId },
      relations: ['student'],
      order: { graduationYear: 'DESC' }
    });
  }

  async toggleFeatured(id: string, tenantId: string): Promise<Alumni> {
    const alumni = await this.alumniRepository.findOne({ where: { id, tenantId } });
    if (!alumni) throw new NotFoundException('Alumni not found');
    
    alumni.isFeatured = !alumni.isFeatured;
    return this.alumniRepository.save(alumni);
  }

  async getAlumniAttendance(alumniId: string): Promise<AlumniAttendee[]> {
    return this.attendeeRepository.find({
      where: { alumniId },
      relations: ['event'],
      order: { event: { eventDate: 'DESC' } },
    });
  }

  // --- Events ---

  async createEvent(dto: CreateAlumniEventDto, tenantId: string): Promise<AlumniEvent> {
    const { sendNotification, ...eventData } = dto;
    const event = this.eventRepository.create({
      ...eventData,
      eventDate: new Date(dto.eventDate),
      tenantId,
    });
    const savedEvent = await this.eventRepository.save(event);

    if (sendNotification) {
      await this.sendEventNotification(savedEvent, tenantId);
    }

    return savedEvent;
  }

  async updateEvent(id: string, dto: UpdateAlumniEventDto, tenantId: string): Promise<AlumniEvent> {
    const event = await this.findOneEvent(id, tenantId);
    const { sendNotification, ...eventData } = dto;
    
    Object.assign(event, {
      ...eventData,
      eventDate: dto.eventDate ? new Date(dto.eventDate) : event.eventDate,
    });
    
    const updatedEvent = await this.eventRepository.save(event);

    if (sendNotification) {
      await this.sendEventNotification(updatedEvent, tenantId);
    }

    return updatedEvent;
  }

  private async sendEventNotification(event: AlumniEvent, tenantId: string) {
    const eventDate = new Date(event.eventDate).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    let target = BroadcastTarget.ALUMNI;
    let targetIds: string[] | undefined = undefined;

    if (event.targetGraduationYear) {
      const targetedAlumni = await this.alumniRepository.find({
        where: { graduationYear: event.targetGraduationYear, tenantId },
        select: ['id']
      });
      
      if (targetedAlumni.length === 0) return; // Nobody to notify
      
      target = BroadcastTarget.INDIVIDUAL_ALUMNI;
      targetIds = targetedAlumni.map(a => a.id);
    }

    await this.broadcastService.broadcast({
      channel: 'EMAIL',
      target,
      targetIds,
      subject: `Upcoming Alumni Event: ${event.title}`,
      body: `
        <div style="font-family: sans-serif; color: #1e293b;">
          <h2 style="color: #2563eb;">New Alumni Event Announcement</h2>
          <p>Hello {first_name},</p>
          <p>We are excited to invite you to an upcoming alumni gathering: <strong>${event.title}</strong>.</p>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-left: 4px solid #2563eb;">
            <p style="margin: 5px 0;"><strong>Date:</strong> ${eventDate}</p>
            <p style="margin: 5px 0;"><strong>Location:</strong> ${event.location || 'To be announced'}</p>
          </div>

          <p>${event.description || ''}</p>

          <p style="margin-top: 25px;">We look forward to seeing you there!</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">Best Regards,<br/>Alumni Relations Team</p>
        </div>
      `
    }, tenantId);
  }

  async findAllEvents(tenantId: string): Promise<AlumniEvent[]> {
    return this.eventRepository.find({
      where: { tenantId },
      order: { eventDate: 'DESC' },
    });
  }

  async findOneEvent(id: string, tenantId: string): Promise<AlumniEvent> {
    const event = await this.eventRepository.findOne({ where: { id, tenantId } });
    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);
    return event;
  }



  async removeEvent(id: string, tenantId: string): Promise<void> {
    const event = await this.findOneEvent(id, tenantId);
    await this.eventRepository.remove(event);
  }

  // --- Attendees ---

  async registerAttendee(eventId: string, alumniId: string, tenantId: string): Promise<AlumniAttendee> {
    const event = await this.findOneEvent(eventId, tenantId);
    const alumni = await this.findOne(alumniId, tenantId);

    const existing = await this.attendeeRepository.findOne({ where: { eventId, alumniId, tenantId } });
    if (existing) return existing;

    const attendee = this.attendeeRepository.create({
      eventId,
      alumniId,
      status: 'attended', // Admin manually marking them as attended
      tenantId,
    });
    return this.attendeeRepository.save(attendee);
  }

  async getEventAttendees(eventId: string, tenantId: string): Promise<AlumniAttendee[]> {
    return this.attendeeRepository.find({
      where: { eventId, tenantId },
      relations: ['alumni', 'alumni.student'],
    });
  }

  async removeAttendee(attendeeId: string, tenantId: string): Promise<void> {
    const attendee = await this.attendeeRepository.findOne({ where: { id: attendeeId, tenantId } });
    if (!attendee) throw new NotFoundException('Attendee record not found');
    await this.attendeeRepository.remove(attendee);
  }
}
