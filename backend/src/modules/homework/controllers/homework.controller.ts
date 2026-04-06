import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, UploadedFiles, UseGuards, Request, Logger, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
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
        // Ensure upload directories exist
        const submissionsPath = join(process.cwd(), 'uploads', 'homework-submissions');
        if (!fs.existsSync(submissionsPath)) {
            fs.mkdirSync(submissionsPath, { recursive: true });
        }

        const homeworkPath = join(process.cwd(), 'uploads', 'homework');
        if (!fs.existsSync(homeworkPath)) {
            fs.mkdirSync(homeworkPath, { recursive: true });
        }
    }

    // --- Submissions ---

    @Post('student-submit')
    @UseInterceptors(FilesInterceptor('attachments', 10, {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = join(process.cwd(), 'uploads', 'homework-submissions');
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                cb(null, `${randomName}${extname(file.originalname)}`);
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
            dto.attachmentUrls = files.map(file => `/uploads/homework-submissions/${file.filename}`);
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

    // --- Homework Management ---

    @Post()
    @UseInterceptors(FileInterceptor('attachment', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = join(process.cwd(), 'uploads', 'homework');
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                cb(null, `${randomName}${extname(file.originalname)}`);
            },
        }),
    }))
    create(
        @Body() createDto: CreateHomeworkDto,
        @UploadedFile() file: Express.Multer.File,
        @Request() req: any
    ) {
        if (file) {
            createDto.attachmentUrl = `/uploads/homework/${file.filename}`;
        }
        return this.homeworkService.create(createDto, req.user.tenantId);
    }

    @Get()
    async findAll(@Query() query: any, @Request() req: any) {
        let studentId = undefined;
        
        // Data scoping for Students
        if (req.user.role === 'student') {
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
