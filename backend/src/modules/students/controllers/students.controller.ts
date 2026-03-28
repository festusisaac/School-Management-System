import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFiles, UseGuards, Request } from '@nestjs/common';
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
import { EntityManager } from 'typeorm';

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
    constructor(
        private readonly studentsService: StudentsService,
        private readonly entityManager: EntityManager,
    ) { }

    // --- Students ---

    @Post()
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
        if (files?.studentPhoto && files.studentPhoto[0]) {
            createStudentDto.studentPhoto = files.studentPhoto[0].path;
        }
        return this.studentsService.create(createStudentDto, req.user.tenantId, files?.documentFiles);
    }

    @Get()
    async findAll(@Query() query: any, @Request() req: any) {
        // Data scoping for Teachers: Only see students in assigned classes
        if (req.user.role === 'teacher') {
            const staffResult = await this.entityManager.query(
                'SELECT id FROM "staff" WHERE email = $1 AND "tenant_id" = $2 LIMIT 1',
                [req.user.email, req.user.tenantId]
            );

            if (staffResult && staffResult.length > 0) {
                const staffId = staffResult[0].id;
                
                // 1. Classes where they are the primary Class Teacher
                const classTeacherClasses = await this.entityManager.query(
                    'SELECT id FROM "classes" WHERE "classTeacherId" = $1 AND "tenantId" = $2',
                    [staffId, req.user.tenantId]
                );
                
                // 2. Classes where they teach specific subjects
                const subjectTeachers = await this.entityManager.query(
                    'SELECT DISTINCT "classId" FROM "subject_teachers" WHERE "teacherId" = $1 AND "tenantId" = $2',
                    [staffId, req.user.tenantId]
                );
                
                const allManagedClassIds = new Set([
                    ...classTeacherClasses.map((c: any) => c.id),
                    ...subjectTeachers.map((st: any) => st.classId)
                ]);

                const classIds = Array.from(allManagedClassIds).filter(Boolean);

                if (classIds.length > 0) {
                    query.classIds = classIds;
                } else {
                    // No assignments, no students
                    return [];
                }
            } else {
                return [];
            }
        }

        return this.studentsService.findAll(query, req.user.tenantId);
    }

    @Get('deactivated')
    async findDeactivated(@Request() req: any) {
        // Teachers only see their own students, even if deactivated
        if (req.user.role === 'teacher') {
            const staffResult = await this.entityManager.query(
                'SELECT id FROM "staff" WHERE email = $1 AND "tenant_id" = $2 LIMIT 1',
                [req.user.email, req.user.tenantId]
            );

            if (!staffResult || staffResult.length === 0) return [];
            const staffId = staffResult[0].id;

            const managedClasses = await this.entityManager.query(
                `SELECT id FROM "classes" WHERE "classTeacherId" = $1 AND "tenantId" = $2
                 UNION
                 SELECT DISTINCT "classId" FROM "subject_teachers" WHERE "teacherId" = $1 AND "tenantId" = $2`,
                [staffId, req.user.tenantId]
            );

            const classIds = managedClasses.map((c: any) => c.id).filter(Boolean);
            if (classIds.length === 0) return [];

            const students = await this.studentsService.findDeactivatedStudents(req.user.tenantId);
            return students.filter(s => classIds.includes(s.classId));
        }

        return this.studentsService.findDeactivatedStudents(req.user.tenantId);
    }

    @Get('profile/me')
    @UseGuards(JwtAuthGuard)
    getProfile(@Request() req: any) {
        return this.studentsService.findOne(req.user.id, req.user.tenantId);
    }

    // --- Categories ---

    createCategory(@Body() dto: CreateStudentCategoryDto, @Request() req: any) {
        return this.studentsService.createCategory(dto, req.user.tenantId);
    }

    @Get('categories')
    findAllCategories(@Request() req: any) {
        return this.studentsService.findAllCategories(req.user.tenantId);
    }

    @Delete('categories/:id')
    removeCategory(@Param('id') id: string, @Request() req: any) {
        return this.studentsService.removeCategory(id, req.user.tenantId);
    }

    // --- Houses ---

    @Post('houses')
    createHouse(@Body() dto: CreateStudentHouseDto, @Request() req: any) {
        return this.studentsService.createHouse(dto, req.user.tenantId);
    }

    @Get('houses')
    findAllHouses(@Request() req: any) {
        return this.studentsService.findAllHouses(req.user.tenantId);
    }

    @Delete('houses/:id')
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

    @Post('online-admissions')
    createOnlineAdmission(@Body() dto: CreateOnlineAdmissionDto, @Request() req: any) {
        return this.studentsService.createOnlineAdmission(dto, req.user.tenantId);
    }

    @Get('online-admissions')
    findAllOnlineAdmissions(@Request() req: any) {
        return this.studentsService.findAllOnlineAdmissions(req.user.tenantId);
    }

    @Get('online-admissions/:id')
    findOneOnlineAdmission(@Param('id') id: string, @Request() req: any) {
        return this.studentsService.findOneOnlineAdmission(id, req.user.tenantId);
    }

    @Patch('online-admissions/:id/status')
    updateOnlineAdmissionStatus(@Param('id') id: string, @Body() dto: UpdateOnlineAdmissionStatusDto, @Request() req: any) {
        return this.studentsService.updateOnlineAdmissionStatus(id, dto, req.user.tenantId);
    }

    @Post('online-admissions/:id/approve')
    approveOnlineAdmission(@Param('id') id: string, @Request() req: any) {
        return this.studentsService.approveOnlineAdmission(id, req.user.tenantId);
    }

    // --- Students (Generic Routes) ---


    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.studentsService.findOne(id, req.user.tenantId);
    }

    @Patch(':id')
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
    update(
        @Param('id') id: string,
        @Body() updateStudentDto: UpdateStudentDto,
        @UploadedFiles() files: { studentPhoto?: Express.Multer.File[], documentFiles?: Express.Multer.File[] },
        @Request() req: any
    ) {
        if (files?.studentPhoto && files.studentPhoto[0]) {
            updateStudentDto.studentPhoto = files.studentPhoto[0].path;
        }
        return this.studentsService.update(id, updateStudentDto, req.user.tenantId, files?.documentFiles);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.studentsService.remove(id, req.user.tenantId);
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
    markAttendance(@Body() dto: MarkAttendanceDto, @Request() req: any) {
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
                'SELECT id FROM "staff" WHERE email = $1 AND "tenant_id" = $2 LIMIT 1',
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
    getAttendanceLogs(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Request() req: any,
        @Query('classId') classId?: string,
        @Query('sectionId') sectionId?: string
    ) {
        return this.studentsService.getAttendanceLogs(startDate, endDate, req.user.tenantId, classId, sectionId);
    }
}

