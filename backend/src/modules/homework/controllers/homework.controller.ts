import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, UploadedFiles, UseGuards, Request, Res, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, basename } from 'path';
import * as fs from 'fs';
import type { Response } from 'express';
import { HomeworkService } from '../services/homework.service';
import { HomeworkSubmissionService } from '../services/homework-submission.service';
import { CreateHomeworkDto } from '../dto/create-homework.dto';
import { UpdateHomeworkDto } from '../dto/update-homework.dto';
import { SubmitHomeworkDto, GradeSubmissionDto } from '../dto/submit-homework.dto';
import { EntityManager } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { UserRole } from '@common/dtos/auth.dto';

@Controller('homework')
@UseGuards(JwtAuthGuard)
export class HomeworkController {
    private readonly logger = new Logger(HomeworkController.name);

    constructor(
        private readonly homeworkService: HomeworkService,
        private readonly submissionService: HomeworkSubmissionService,
        private readonly entityManager: EntityManager,
    ) {
        // Homework files are PRIVATE: stored outside the publicly-served
        // /uploads tree so they can only be reached via the authenticated,
        // access-scoped download endpoints below (not by guessing a URL).
        const submissionsPath = join(process.cwd(), 'private-uploads', 'homework-submissions');
        if (!fs.existsSync(submissionsPath)) {
            fs.mkdirSync(submissionsPath, { recursive: true });
        }

        const homeworkPath = join(process.cwd(), 'private-uploads', 'homework');
        if (!fs.existsSync(homeworkPath)) {
            fs.mkdirSync(homeworkPath, { recursive: true });
        }
    }

    /**
     * Random, unguessable stored filename that also embeds the original name
     * (URL-encoded, filesystem-safe) so we can restore it on download without a
     * schema change. e.g. "a1b2...__My%20Essay.pdf"
     */
    private static storedFilename(originalName: string): string {
        const rand = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return `${rand}__${encodeURIComponent(originalName || 'file')}`;
    }

    /** Recover the original filename embedded in a stored path (or fall back). */
    private originalNameFromPath(storedPath?: string): string | null {
        if (!storedPath) return null;
        const base = storedPath.split('/').pop() || '';
        const sep = base.indexOf('__');
        if (sep === -1) return base || null; // legacy files: use the stored name
        try { return decodeURIComponent(base.slice(sep + 2)) || base; } catch { return base; }
    }

    /** Resolve a stored path to an absolute path, guarding against traversal. */
    private resolveStoredPath(storedPath?: string): string | null {
        if (!storedPath) return null;
        const rel = storedPath.replace(/^\/+/, '');
        const abs = join(process.cwd(), rel);
        const allowedRoots = [join(process.cwd(), 'private-uploads'), join(process.cwd(), 'uploads')];
        if (!allowedRoots.some((root) => abs.startsWith(root))) return null;
        if (!fs.existsSync(abs)) return null;
        return abs;
    }

    /** Verify the requesting user may access a given homework (by class). */
    private async assertHomeworkAccess(homework: any, user: any): Promise<void> {
        const role = (user.role || '').toLowerCase();
        if (role === 'student' || user.role === UserRole.STUDENT) {
            const sid = await this.submissionService.resolveStudentId(user.studentId || user.id, user.tenantId);
            const st = await this.entityManager.getRepository(Student).findOne({ where: { id: sid, tenantId: user.tenantId } });
            if (!st || st.classId !== homework.classId) throw new ForbiddenException('You cannot access this file.');
        } else if (role === 'parent' || user.role === UserRole.PARENT) {
            const rows = await this.entityManager.query(
                `SELECT 1 FROM students s JOIN parents p ON p.id = s."parentId" WHERE p."userId" = $1 AND s."classId" = $2 AND s."tenantId" = $3 LIMIT 1`,
                [user.id, homework.classId, user.tenantId]
            );
            if (!rows || rows.length === 0) throw new ForbiddenException('You cannot access this file.');
        } else if (role === 'teacher') {
            const staff = await this.entityManager.query('SELECT id FROM "staff" WHERE email = $1 AND "tenantId" = $2 LIMIT 1', [user.email, user.tenantId]);
            if (!staff || staff.length === 0) throw new ForbiddenException('You cannot access this file.');
            const managed = await this.entityManager.query(
                `SELECT id FROM "classes" WHERE "classTeacherId" = $1 AND "tenantId" = $2
                 UNION SELECT DISTINCT "classId" FROM "subject_teachers" WHERE "teacherId" = $1 AND "tenantId" = $2`,
                [staff[0].id, user.tenantId]
            );
            if (!managed.map((c: any) => c.id).includes(homework.classId)) throw new ForbiddenException('You cannot access this file.');
        }
        // admin / other privileged roles: allowed
    }

    // --- Submissions ---

    @Post('student-submit')
    @UseInterceptors(FilesInterceptor('attachments', 10, {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = join(process.cwd(), 'private-uploads', 'homework-submissions');
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                cb(null, HomeworkController.storedFilename(file.originalname));
            },
        }),
    }))
    submit(
        @Body() dto: SubmitHomeworkDto,
        @UploadedFiles() files: Express.Multer.File[],
        @Request() req: any
    ) {
        this.logger.debug(`Homework submission received: ${JSON.stringify(dto)}`);
        this.logger.debug(`Files received: ${files?.length || 0}`);
        this.logger.debug(`User identity: ${JSON.stringify(req.user)}`);

        if (files && files.length > 0) {
            dto.attachmentUrls = files.map(file => `/private-uploads/homework-submissions/${file.filename}`);
        }
        const studentId = req.user.studentId || req.user.id; 
        return this.submissionService.submit(dto, studentId, req.user.tenantId);
    }

    @Get('submissions/my')
    async findMySubmissions(@Request() req: any) {
        let studentId = req.user.studentId || req.user.id;
        // Resolve studentId if it's actually a userId
        studentId = await this.submissionService.resolveStudentId(studentId, req.user.tenantId);
        return this.submissionService.findByStudent(studentId, req.user.tenantId);
    }

    @Get('submissions/:id')
    async findOneSubmission(@Param('id') id: string, @Request() req: any) {
        const submission = await this.submissionService.findOne(id, req.user.tenantId);
        
        // Security scoping for students
        if (req.user.role === 'student' || req.user.role === UserRole.STUDENT) {
            const studentId = await this.submissionService.resolveStudentId(req.user.studentId || req.user.id, req.user.tenantId);
            if (submission.studentId !== studentId) {
                throw new ForbiddenException('You can only view your own submission.');
            }
        }
        return submission;
    }

    @Get(':homeworkId/submissions')
    async findByHomework(@Param('homeworkId') homeworkId: string, @Request() req: any) {
        // Only teachers and admins can view all submissions for a homework
        if (req.user.role === 'student' || req.user.role === UserRole.STUDENT) {
            throw new ForbiddenException('You do not have permission to view all submissions.');
        }
        return this.submissionService.findByHomework(homeworkId, req.user.tenantId);
    }

    @Patch('submissions/:id/grade')
    async grade(@Param('id') id: string, @Body() dto: GradeSubmissionDto, @Request() req: any) {
        // Only teachers and admins can grade submissions
        if (req.user.role === 'student' || req.user.role === UserRole.STUDENT) {
            throw new ForbiddenException('You do not have permission to grade submissions.');
        }
        return this.submissionService.grade(id, dto, req.user.tenantId);
    }

    // --- Secure file downloads (authenticated + access-scoped) ---

    /** Download a submission's attachment (student's own, or teacher/admin). */
    @Get('submissions/:id/attachment/:index')
    async downloadSubmissionAttachment(
        @Param('id') id: string,
        @Param('index') index: string,
        @Request() req: any,
        @Res() res: Response,
    ) {
        const submission = await this.submissionService.findOne(id, req.user.tenantId);
        if (!submission) throw new NotFoundException('Submission not found');

        const role = (req.user.role || '').toLowerCase();
        if (role === 'student' || req.user.role === UserRole.STUDENT) {
            const sid = await this.submissionService.resolveStudentId(req.user.studentId || req.user.id, req.user.tenantId);
            if (submission.studentId !== sid) throw new ForbiddenException('You can only access your own submission.');
        } else if (role === 'parent' || req.user.role === UserRole.PARENT) {
            const rows = await this.entityManager.query(
                `SELECT 1 FROM students s JOIN parents p ON p.id = s."parentId" WHERE p."userId" = $1 AND s.id = $2 AND s."tenantId" = $3 LIMIT 1`,
                [req.user.id, submission.studentId, req.user.tenantId]
            );
            if (!rows || rows.length === 0) throw new ForbiddenException('You cannot access this file.');
        }
        // teacher / admin: allowed

        const urls: string[] = submission.attachmentUrls || [];
        const i = parseInt(index, 10);
        if (isNaN(i) || i < 0 || i >= urls.length) throw new NotFoundException('Attachment not found');

        const abs = this.resolveStoredPath(urls[i]);
        if (!abs) throw new NotFoundException('File not found');
        return res.download(abs, this.originalNameFromPath(urls[i]) || basename(abs));
    }

    /** Download a homework's material file (teacher's attachment). */
    @Get(':id/attachment')
    async downloadHomeworkAttachment(
        @Param('id') id: string,
        @Request() req: any,
        @Res() res: Response,
    ) {
        const homework = await this.homeworkService.findOne(id, req.user.tenantId);
        if (!homework || !homework.attachmentUrl) throw new NotFoundException('No attachment for this homework');

        await this.assertHomeworkAccess(homework, req.user);

        const abs = this.resolveStoredPath(homework.attachmentUrl);
        if (!abs) throw new NotFoundException('File not found');
        return res.download(abs, this.originalNameFromPath(homework.attachmentUrl) || basename(abs));
    }

    // --- Homework Management ---

    @Post()
    @UseInterceptors(FileInterceptor('attachment', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = join(process.cwd(), 'private-uploads', 'homework');
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                cb(null, HomeworkController.storedFilename(file.originalname));
            },
        }),
    }))
    create(
        @Body() createDto: CreateHomeworkDto,
        @UploadedFile() file: Express.Multer.File,
        @Request() req: any
    ) {
        if (file) {
            createDto.attachmentUrl = `/private-uploads/homework/${file.filename}`;
        }
        return this.homeworkService.create(createDto, req.user.tenantId);
    }

    @Get()
    async findAll(@Query() query: any, @Request() req: any) {
        let studentId = undefined;
        
        // Data scoping for Students
        if (req.user.role === 'student' || req.user.role === UserRole.STUDENT) {
            const rawId = req.user.studentId || req.user.id;
            studentId = await this.submissionService.resolveStudentId(rawId, req.user.tenantId);

            // Fetch student to get their classId
            const student = await this.entityManager.getRepository(Student).findOne({
                where: { id: studentId, tenantId: req.user.tenantId }
            });

            if (student && student.classId) {
                // FORCE filtering by student's class
                query.classId = student.classId;
            } else {
                // If no student record or class found, return empty set for security
                return [];
            }
        }

        // Data scoping for Parents
        if (req.user.role === 'parent' || req.user.role === UserRole.PARENT) {
            studentId = query.studentId;
            if (!studentId) {
                return []; // Parent must specify which child's homework to see
            }

            // Verify access
            const hasAccess = await this.entityManager.query(`
                SELECT 1 FROM students s 
                JOIN parents p ON p.id = s."parentId" 
                WHERE p."userId" = $1 AND s.id = $2 AND s."tenantId" = $3
            `, [req.user.id, studentId, req.user.tenantId]);

            if (!hasAccess || hasAccess.length === 0) {
                throw new ForbiddenException('You can only view homework for your own children.');
            }

            // Fetch student to get their classId
            const student = await this.entityManager.getRepository(Student).findOne({
                where: { id: studentId, tenantId: req.user.tenantId }
            });

            if (student && student.classId) {
                query.classId = student.classId;
            } else {
                return [];
            }
        }

        // Data scoping for Teachers: See homework for assigned classes
        if (req.user.role === 'teacher') {
            const staffResult = await this.entityManager.query(
                'SELECT id FROM "staff" WHERE email = $1 AND "tenantId" = $2 LIMIT 1',
                [req.user.email, req.user.tenantId]
            );

            if (staffResult && staffResult.length > 0) {
                const staffId = staffResult[0].id;

                // Combine Class Teacher and Subject Teacher assignments
                const managedClasses = await this.entityManager.query(
                    `SELECT id FROM "classes" WHERE "classTeacherId" = $1 AND "tenantId" = $2
                     UNION
                     SELECT DISTINCT "classId" FROM "subject_teachers" WHERE "teacherId" = $1 AND "tenantId" = $2`,
                    [staffId, req.user.tenantId]
                );

                const classIds = managedClasses.map((c: any) => c.id).filter(Boolean);

                if (classIds.length > 0) {
                    query.classIds = classIds;
                } else {
                    return [];
                }
            } else {
                return [];
            }
        }

        return this.homeworkService.findAll(req.user.tenantId, query, studentId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.homeworkService.findOne(id, req.user.tenantId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: UpdateHomeworkDto, @Request() req: any) {
        return this.homeworkService.update(id, updateDto, req.user.tenantId);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.homeworkService.remove(id, req.user.tenantId);
    }
}
