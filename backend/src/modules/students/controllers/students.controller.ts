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

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
    constructor(private readonly studentsService: StudentsService) { }

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
    findAll(@Query() query: any, @Request() req: any) {
        return this.studentsService.findAll(query, req.user.tenantId);
    }

    findDeactivated(@Request() req: any) {
        return this.studentsService.findDeactivatedStudents(req.user.tenantId);
    }

    @Get('profile/me')
    @UseGuards(JwtAuthGuard)
    getProfile(@Request() req: any) {
        return this.studentsService.findByUserId(req.user.id);
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

    // --- Online Admission ---

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

    @Get('profile/me')
    async getProfile(@Request() req: any) {
        // Find the student record associated with the logged-in user's ID
        const userId = req.user.sub || req.user.id;
        const student = await this.studentsService.findOne(userId, req.user.tenantId);
        return student;
    }

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
}
