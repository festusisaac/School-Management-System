import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, EntityManager, ILike } from 'typeorm';
import { LessonNote } from '../entities/lesson-note.entity';
import { CreateLessonNoteDto, UpdateLessonNoteDto, LessonNoteFilterDto } from '../dto/lesson-note.dto';
import { User } from '../../auth/entities/user.entity';
import { EmailService } from '@modules/internal-communication/email.service';

@Injectable()
export class LessonNotesService {
    constructor(
        @InjectRepository(LessonNote)
        private lessonNoteRepository: Repository<LessonNote>,
        private readonly entityManager: EntityManager,
        private readonly emailService: EmailService,
    ) {}

    async create(createDto: CreateLessonNoteDto, teacher: User, tenantId: string): Promise<LessonNote> {
        const lessonNote = this.lessonNoteRepository.create({
            ...createDto,
            teacherId: teacher.id,
            tenantId,
            status: 'draft',
        });
        return this.lessonNoteRepository.save(lessonNote);
    }

    async findAll(filterDto: LessonNoteFilterDto, user: User, tenantId: string): Promise<LessonNote[]> {
        const query = this.lessonNoteRepository.createQueryBuilder('lessonNote')
            .leftJoinAndSelect('lessonNote.teacher', 'teacher')
            .leftJoinAndSelect('lessonNote.subject', 'subject')
            .leftJoinAndSelect('lessonNote.class', 'class')
            .where('lessonNote.tenantId = :tenantId', { tenantId });

        const userRole = user.role.toLowerCase();
        const isAdmin = userRole.includes('super administrator') || userRole.includes('admin') || userRole.includes('supervisor');

        if (isAdmin) {
            // Admins/Supervisors see all notes that are NOT drafts, 
            // OR drafts that they own themselves
            query.andWhere(new Brackets(qb => {
                qb.where('lessonNote.status != :draftStatus', { draftStatus: 'draft' })
                  .orWhere('lessonNote.teacherId = :userId', { userId: user.id });
            }));
        } else {
            // Teachers and other staff only see THEIR OWN notes
            query.andWhere('lessonNote.teacherId = :userId', { userId: user.id });
        }

        if (filterDto.subjectId) {
            query.andWhere('lessonNote.subjectId = :subjectId', { subjectId: filterDto.subjectId });
        }
        if (filterDto.classId) {
            query.andWhere('lessonNote.classId = :classId', { classId: filterDto.classId });
        }
        if (filterDto.teacherId) {
            query.andWhere('lessonNote.teacherId = :teacherId', { teacherId: filterDto.teacherId });
        }
        if (filterDto.status) {
            query.andWhere('lessonNote.status = :status', { status: filterDto.status });
        }
        if (filterDto.termId) {
            query.andWhere('lessonNote.termId = :termId', { termId: filterDto.termId });
        }
        if (filterDto.sessionId) {
            query.andWhere('lessonNote.sessionId = :sessionId', { sessionId: filterDto.sessionId });
        }

        return query.orderBy('lessonNote.createdAt', 'DESC').getMany();
    }

    async findOne(id: string, tenantId: string): Promise<LessonNote> {
        const lessonNote = await this.lessonNoteRepository.findOne({
            where: { id, tenantId },
            relations: ['teacher', 'subject', 'class', 'reviewer', 'term', 'session'],
        });
        if (!lessonNote) {
            throw new NotFoundException('Lesson note not found');
        }
        return lessonNote;
    }

    async update(id: string, updateDto: UpdateLessonNoteDto, user: User, tenantId: string): Promise<LessonNote> {
        const lessonNote = await this.findOne(id, tenantId);

        // Security: Only teacher who created it can edit if it's draft or rejected
        const isOwner = lessonNote.teacherId === user.id;
        const isAdmin = user.role.toLowerCase().includes('admin');

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('You are not allowed to update this lesson note');
        }

        if (isOwner && !isAdmin && lessonNote.status === 'approved') {
            throw new ForbiddenException('Cannot edit an approved lesson note');
        }

        Object.assign(lessonNote, updateDto);
        return this.lessonNoteRepository.save(lessonNote);
    }

    async delete(id: string, user: User, tenantId: string): Promise<void> {
        const lessonNote = await this.findOne(id, tenantId);
        const isOwner = lessonNote.teacherId === user.id;
        const isAdmin = user.role.toLowerCase().includes('admin');

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('You are not allowed to delete this lesson note');
        }

        await this.lessonNoteRepository.remove(lessonNote);
    }

    async submit(id: string, user: User, tenantId: string): Promise<LessonNote> {
        const lessonNote = await this.findOne(id, tenantId);
        if (lessonNote.teacherId !== user.id) {
            throw new ForbiddenException('Only the owner can submit this lesson note');
        }
        lessonNote.status = 'submitted';
        const savedNote = await this.lessonNoteRepository.save(lessonNote);

        try {
            // Find active super administrators for the same tenant
            const superAdmins = await this.entityManager.find(User, {
                where: {
                    role: ILike('%super administrator%'),
                    tenantId,
                    isActive: true,
                },
            });

            // Send notification email to each super administrator
            for (const admin of superAdmins) {
                await this.emailService.sendNotificationEmail(
                    admin.email,
                    `New Lesson Note Submitted: ${savedNote.topic}`,
                    `A new lesson note has been submitted for review by teacher <strong>${lessonNote.teacher?.firstName || 'Unknown'} ${lessonNote.teacher?.lastName || 'Teacher'}</strong>.<br/><br/>` +
                        `<strong>Topic:</strong> ${savedNote.topic}<br/>` +
                        `<strong>Subject:</strong> ${savedNote.subject?.name || 'N/A'}<br/>` +
                        `<strong>Class:</strong> ${savedNote.class?.name || 'N/A'}<br/><br/>` +
                        `Please login to the portal to review and approve/reject this lesson note.`,
                    'Lesson Note Submitted',
                );
            }
        } catch (error) {
            // Log the error but do not block the submission if email fails
            console.error('Failed to send lesson note submission notification email:', error);
        }

        return savedNote;
    }

    async review(id: string, status: 'approved' | 'rejected', reviewNotes: string, reviewer: User, tenantId: string): Promise<LessonNote> {
        const lessonNote = await this.findOne(id, tenantId);
        lessonNote.status = status;
        lessonNote.reviewNotes = reviewNotes;
        lessonNote.reviewerId = reviewer.id;
        lessonNote.reviewedAt = new Date();
        return this.lessonNoteRepository.save(lessonNote);
    }

    async clone(id: string, teacher: User, tenantId: string): Promise<LessonNote> {
        const original = await this.findOne(id, tenantId);
        const { id: _, createdAt, updatedAt, ...rest } = original;
        const clone = this.lessonNoteRepository.create({
            ...rest,
            status: 'draft',
            teacherId: teacher.id,
            reviewerId: undefined,
            reviewedAt: undefined,
            reviewNotes: undefined,
        });
        return this.lessonNoteRepository.save(clone);
    }
}
