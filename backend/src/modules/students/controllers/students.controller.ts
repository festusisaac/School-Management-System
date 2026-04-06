import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFiles, UseGuards, Request, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Public } from '@decorators/public.decorator';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { StudentsService } from '../services/students.service';
import { CreateStudentDto } from '../dtos/create-student.dto';
import { UpdateStudentDto } from '../dtos/update-student.dto';
import { CreateStudentCategoryDto } from '../dtos/student-category.dto';
import { CreateStudentHouseDto } from '../dtos/student-house.dto';
import { CreateDeactivateReasonDto } from '../dtos/deactivate-reason.dto';
import { CreateOnlineAdmissionDto } from '../dtos/create-online-admission.dto';
import { UpdateOnlineAdmissionStatusDto } from '../dtos/update-online-admission-status.dto';
import { MarkAttendanceDto, BulkMarkAttendanceDto } from '../dtos/student-attendance.dto';
import { Permissions } from '@decorators/permissions.decorator';
import { PermissionsGuard } from '@guards/permissions.guard';
import { EntityManager, In } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { HttpStatus, HttpCode } from '@nestjs/common';

@Controller('students')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StudentsController {
    constructor(
        private readonly studentsService: StudentsService,
        private readonly entityManager: EntityManager,
        @InjectQueue('student-import') private readonly studentImportQueue: Queue
    ) { }

    private async getTeacherManagedClassIds(user: any): Promise<string[] | null> {
        const role = (user.role || '').toLowerCase();
        
        // 1. Administrators see everything (Full Access)
        if (role === 'super administrator' || role === 'admin') {
            return null;
        }

        // 2. Everyone else (Teachers, Staff, etc.) is scoped by their staff assignments
        console.log(`[RBAC] Scoping access for user: ${user.email} (Role: ${role})`);

        const staffResult = await this.entityManager.query(
            'SELECT id FROM "staff" WHERE LOWER(email) = LOWER($1) AND "tenantId" = $2 LIMIT 1',
            [user.email, user.tenantId]
        );

        if (!staffResult || staffResult.length === 0) {
            // Not an admin and no staff record? Return empty to deny access by default
            console.warn(`[RBAC] Warning: No staff record found for non-admin user ${user.email}`);
            return [];
        }
        
        const staffId = staffResult[0].id;

        const classes = await this.entityManager.query(
            `SELECT id FROM "classes" WHERE "classTeacherId" = $1 AND "tenantId" = $2
             UNION
             SELECT DISTINCT "classId" FROM "subject_teachers" WHERE "teacherId" = $1 AND "tenantId" = $2`,
            [staffId, user.tenantId]
        );

        const ids = classes.map((c: any) => c.id).filter(Boolean);
        console.log(`[RBAC] Scoping teacher ${user.email} to ${ids.length} classes.`);
        return ids;
    }

    private async validateStudentAccess(studentId: string, tenantId: string, user: any) {
        const classIds = await this.getTeacherManagedClassIds(user);
        if (!classIds) return true; // Full access for admins

        const student = await this.studentsService.findOne(studentId, tenantId);
        if (!student || !student.classId || !classIds.includes(student.classId)) {
            throw new ForbiddenException('You only have permission to access students in your assigned classes.');
        }
        return true;
    }

    // --- Students ---

    @Post()
    @Permissions('students:create')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'studentPhoto', maxCount: 1 },
        { name: 'documentFiles', maxCount: 10 },
    ], {
        storage: diskStorage({
            destination: './uploads/students',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                cb(null, `${randomName}${extname(file.originalname)}`);
            },
        }),
    }))
    create(
        @Body() createStudentDto: CreateStudentDto,
        @UploadedFiles() files: { studentPhoto?: Express.Multer.File[], documentFiles?: Express.Multer.File[] },
        @Request() req: any
    ) {
        if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
        if (files?.studentPhoto && files.studentPhoto[0]) {
            createStudentDto.studentPhoto = files.studentPhoto[0].path;
        }
        return this.studentsService.create(createStudentDto, req.user.tenantId, files?.documentFiles);
    }

    @Get()
    @Permissions('students:view_directory')
    async findAll(@Query() query: any, @Request() req: any) {
        if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
        const managedClassIds = await this.getTeacherManagedClassIds(req.user);
        if (managedClassIds !== null) {
            if (managedClassIds.length === 0) return [];
            query.classIds = managedClassIds;
        }

        return this.studentsService.findAll(query, req.user.tenantId!);
    }

    @Get('deactivated')
    @Permissions('students:delete')
    async findDeactivated(@Request() req: any) {
        const managedClassIds = await this.getTeacherManagedClassIds(req.user);
        if (managedClassIds !== null) {
            if (managedClassIds.length === 0) return [];
            const students = await this.studentsService.findDeactivatedStudents(req.user.tenantId!);
            return students.filter(s => s.classId && managedClassIds.includes(s.classId));
        }

        return this.studentsService.findDeactivatedStudents(req.user?.tenantId!);
    }

    @Get('profile/me')
    @UseGuards(JwtAuthGuard)
    getProfile(@Request() req: any) {
        if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
        return this.studentsService.findOne(req.user.id, req.user.tenantId!);
    }

    @Get('profile/:id')
    @UseGuards(JwtAuthGuard)
    async findOneProfile(@Param('id') id: string, @Request() req: any) {
        if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');

        const userRole = (req.user.role || '').toLowerCase();
        const isSuperAdmin = userRole === 'super administrator';
        const hasFullAccess = isSuperAdmin || (req.user.permissions || []).includes('students:view_profile');

        if (!hasFullAccess && req.user.id !== id) {
            const student = await this.studentsService.findByUserId(req.user.id);
            if (!student || student.id !== id) {
                throw new ForbiddenException('You only have permission to view your own profile.');
            }
        }

        return this.studentsService.findOne(id, req.user.tenantId!);
    }

    @Post('categories')
    @Permissions('students:manage_categories')
    createCategory(@Body() dto: CreateStudentCategoryDto, @Request() req: any) {
        if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
        return this.studentsService.createCategory(dto, req.user.tenantId);
    }

    @Get('categories')
    @Permissions('students:manage_categories')
    findAllCategories(@Request() req: any) {
        if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
        return this.studentsService.findAllCategories(req.user.tenantId);
    }

    @Delete('categories/:id')
    @Permissions('students:manage_categories')
    removeCategory(@Param('id') id: string, @Request() req: any) {
        if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
        return this.studentsService.removeCategory(id, req.user.tenantId);
    }
    // --- Houses ---

    @Post('houses')
    @Permissions('students:manage_categories')
    createHouse(@Body() dto: CreateStudentHouseDto, @Request() req: any) {
        return this.studentsService.createHouse(dto, req.user.tenantId);
    }

    @Get('houses')
    findAllHouses(@Request() req: any) {
        return this.studentsService.findAllHouses(req.user.tenantId);
    }

    @Delete('houses/:id')
    @Permissions('students:manage_categories')
    removeHouse(@Param('id') id: string, @Request() req: any) {
        return this.studentsService.removeHouse(id, req.user.tenantId);
    }

    // --- Deactivate Reasons ---

    @Post('deactivate-reasons')
    createDeactivateReason(@Body() dto: CreateDeactivateReasonDto, @Request() req: any) {
        return this.studentsService.createDeactivateReason(dto, req.user.tenantId);
    }

    @Get('deactivate-reasons/all')
    findAllDeactivateReasons(@Request() req: any) {
        return this.studentsService.findAllDeactivateReasons(req.user.tenantId);
    }

    @Delete('deactivate-reasons/:id')
    removeDeactivateReason(@Param('id') id: string, @Request() req: any) {
        return this.studentsService.removeDeactivateReason(id, req.user.tenantId);
    }

    @Public()
    @Post('online-admissions')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'passportPhoto', maxCount: 1 },
        { name: 'birthCertificate', maxCount: 1 },
    ], {
        storage: diskStorage({
            destination: './uploads/admissions',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                cb(null, `${randomName}${extname(file.originalname)}`);
            },
        }),
    }))
    async createOnlineAdmission(
        @Body() dto: CreateOnlineAdmissionDto, 
        @UploadedFiles() files: { passportPhoto?: Express.Multer.File[], birthCertificate?: Express.Multer.File[] },
        @Request() req: any
    ) {
        let tenantId = req.user?.tenantId;
        
        if (!tenantId) {
            // Resolve tenantId from the first super admin for public requests
            const result = await this.entityManager.query('SELECT "tenantId" FROM "users" WHERE "role" ILIKE \'%Super Administrator%\' LIMIT 1');
            tenantId = result[0]?.tenantId;
        }

        if (!tenantId) throw new ForbiddenException('Tenant context missing');
        
        if (files?.passportPhoto && files.passportPhoto[0]) {
            (dto as any).passportPhoto = files.passportPhoto[0].path;
        }
        if (files?.birthCertificate && files.birthCertificate[0]) {
            (dto as any).birthCertificate = files.birthCertificate[0].path;
        }

        return this.studentsService.createOnlineAdmission(dto, tenantId);
    }

    @Public()
    @Get('online-admission/verify-payment/:reference')
    async verifyAdmissionPayment(@Param('reference') reference: string, @Query('email') email: string) {
        if (!email) throw new BadRequestException('Email is required for verification');
        
        // Resolve tenantId from the first super admin since this is a public request
        const result = await this.entityManager.query('SELECT "tenantId" FROM "users" WHERE "role" ILIKE \'%Super Administrator%\' LIMIT 1');
        const tenantId = result[0]?.tenantId;
        
        if (!tenantId) throw new ForbiddenException('Tenant context missing');
        
        return this.studentsService.verifyAdmissionPayment(reference, email, tenantId);
    }

    @Public()
    @Get('online-admissions/status/:referenceNumber')
    async getOnlineAdmissionStatus(@Param('referenceNumber') referenceNumber: string) {
        return this.studentsService.findOnlineAdmissionByReference(referenceNumber);
    }

    @Get('online-admissions')
    @Permissions('students:create')
    findAllOnlineAdmissions(@Request() req: any) {
        return this.studentsService.findAllOnlineAdmissions(req.user.tenantId);
    }

    @Get('online-admissions/:id')
    @Permissions('students:create')
    findOneOnlineAdmission(@Param('id') id: string, @Request() req: any) {
        return this.studentsService.findOneOnlineAdmission(id, req.user.tenantId);
    }

    @Patch('online-admissions/:id/status')
    @Permissions('students:create')
    updateOnlineAdmissionStatus(@Param('id') id: string, @Body() dto: UpdateOnlineAdmissionStatusDto, @Request() req: any) {
        return this.studentsService.updateOnlineAdmissionStatus(id, dto, req.user.tenantId);
    }

    @Post('online-admissions/:id/approve')
    @Permissions('students:create')
    approveOnlineAdmission(@Param('id') id: string, @Request() req: any) {
        return this.studentsService.approveOnlineAdmission(id, req.user.tenantId);
    }

    // --- Students (Generic Routes) ---


    @Get(':id')
    @Permissions('students:view_profile')
    async findOne(@Param('id') id: string, @Request() req: any) {
        if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
        await this.validateStudentAccess(id, req.user.tenantId!, req.user);
        return this.studentsService.findOne(id, req.user.tenantId!);
    }

    @Patch(':id')
    @Permissions('students:edit')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'studentPhoto', maxCount: 1 },
        { name: 'documentFiles', maxCount: 10 },
    ], {
        storage: diskStorage({
            destination: './uploads/students',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                cb(null, `${randomName}${extname(file.originalname)}`);
            },
        }),
    }))
    async update(
        @Param('id') id: string,
        @Body() updateStudentDto: UpdateStudentDto,
        @UploadedFiles() files: { studentPhoto?: Express.Multer.File[], documentFiles?: Express.Multer.File[] },
        @Request() req: any
    ) {
        await this.validateStudentAccess(id, req.user.tenantId, req.user);
        if (files?.studentPhoto && files.studentPhoto[0]) {
            updateStudentDto.studentPhoto = files.studentPhoto[0].path;
        }
        return this.studentsService.update(id, updateStudentDto, req.user.tenantId, files?.documentFiles);
    }

    @Delete(':id')
    @Permissions('students:delete')
    async remove(@Param('id') id: string, @Request() req: any) {
        await this.validateStudentAccess(id, req.user.tenantId, req.user);
        // We now perform a deactivation instead of a hard removal to preserve historical records.
        return this.studentsService.deactivate(id, req.user.tenantId);
    }

    @Patch(':id/deactivate')
    @Permissions('students:delete')
    async deactivate(
        @Param('id') id: string,
        @Body('reasonId') reasonId: string,
        @Request() req: any
    ) {
        await this.validateStudentAccess(id, req.user.tenantId, req.user);
        return this.studentsService.deactivate(id, req.user.tenantId, reasonId);
    }

    @Patch(':id/activate')
    @Permissions('students:delete')
    async activate(@Param('id') id: string, @Request() req: any) {
        await this.validateStudentAccess(id, req.user.tenantId, req.user);
        return this.studentsService.activate(id, req.user.tenantId);
    }

    @Delete('documents/:id')
    removeDocument(@Param('id') id: string, @Request() req: any) {
        return this.studentsService.removeDocument(id, req.user.tenantId);
    }

    @Post('bulk/promote')
    promote(@Body() dto: { studentIds: string[], classId: string, sectionId?: string }, @Request() req: any) {
        return this.studentsService.promote(dto, req.user.tenantId);
    }

    // --- Attendance ---

    @Post('attendance/mark')
    @Permissions('attendance:mark')
    async markAttendance(@Body() dto: MarkAttendanceDto, @Request() req: any) {
        await this.validateStudentAccess(dto.studentId, req.user.tenantId, req.user);
        return this.studentsService.markAttendance(dto, req.user.tenantId);
    }

    @Post('attendance/bulk')
    bulkMarkAttendance(@Body() dto: BulkMarkAttendanceDto, @Request() req: any) {
        return this.studentsService.bulkMarkAttendance(dto, req.user.tenantId);
    }

    @Get('attendance/student/:studentId')
    getStudentAttendance(
        @Param('studentId') studentId: string,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Request() req: any
    ) {
        return this.studentsService.getStudentAttendance(studentId, startDate, endDate, req.user.tenantId);
    }

    @Get('attendance/class/:classId')
    async getClassAttendance(
        @Param('classId') classId: string,
        @Query('date') date: string,
        @Request() req: any,
        @Query('sectionId') sectionId?: string
    ) {
        // Teacher scoping check
        if (req.user.role === 'teacher') {
            const staffResult = await this.entityManager.query(
                'SELECT id FROM "staff" WHERE email = $1 AND "tenantId" = $2 LIMIT 1',
                [req.user.email, req.user.tenantId]
            );

            if (!staffResult || staffResult.length === 0) return [];
            const staffId = staffResult[0].id;

            const isAssigned = await this.entityManager.query(
                `SELECT 1 FROM "classes" WHERE id = $1 AND "classTeacherId" = $2
                 UNION
                 SELECT 1 FROM "subject_teachers" WHERE "classId" = $1 AND "teacherId" = $2`,
                [classId, staffId]
            );

            if (!isAssigned || isAssigned.length === 0) {
                return [];
            }
        }

        return this.studentsService.getClassAttendance(classId, date, req.user.tenantId, sectionId);
    }

    @Get('attendance/logs')
    @Permissions('attendance:view_history')
    async getAttendanceLogs(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Request() req: any,
        @Query('classId') classId?: string,
        @Query('sectionId') sectionId?: string
    ) {
        const managedClassIds = await this.getTeacherManagedClassIds(req.user);
        if (managedClassIds !== null) {
            if (managedClassIds.length === 0) return [];
            
            // If classId is specified, check if teacher is allowed to see it
            if (classId && !managedClassIds.includes(classId)) {
                throw new ForbiddenException('You only have permission to view logs for your assigned classes.');
            }
            
            // If no classId is specified, restrict to ALL assigned classes
            return this.studentsService.getAttendanceLogs(startDate, endDate, req.user.tenantId, classId || undefined, sectionId || undefined, managedClassIds);
        }

        return this.studentsService.getAttendanceLogs(startDate, endDate, req.user.tenantId, classId, sectionId);
    }

    // --- Bulk Import Endpoints ---

    @Post('bulk/validate')
    @Permissions('students:create')
    async validateBulk(@Body() data: any[], @Request() req: any) {
        return this.studentsService.validateBulk(data, req.user.tenantId);
    }

    @Post('bulk/import')
    @Permissions('students:create')
    @HttpCode(HttpStatus.ACCEPTED)
    async importBulk(@Body() data: any[], @Request() req: any) {
        const job = await this.studentImportQueue.add('import-students', {
            data,
            tenantId: req.user.tenantId,
            userEmail: req.user.email
        });
        return { jobId: job.id };
    }

    @Get('bulk/import/status/:jobId')
    @Permissions('students:create')
    async getImportStatus(@Param('jobId') jobId: string) {
        const job = await this.studentImportQueue.getJob(jobId);
        if (!job) {
            throw new Error('Job not found');
        }

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
}

