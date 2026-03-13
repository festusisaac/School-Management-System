import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFiles } from '@nestjs/common';
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
        @UploadedFiles() files: { studentPhoto?: Express.Multer.File[], documentFiles?: Express.Multer.File[] }
    ) {
        if (files?.studentPhoto && files.studentPhoto[0]) {
            createStudentDto.studentPhoto = files.studentPhoto[0].path;
        }
        return this.studentsService.create(createStudentDto, files?.documentFiles);
    }

    @Get()
    findAll(@Query() query: any) {
        return this.studentsService.findAll(query);
    }

    @Get('deactivated')
    findDeactivated() {
        return this.studentsService.findDeactivatedStudents();
    }

    // --- Categories ---

    @Post('categories')
    createCategory(@Body() dto: CreateStudentCategoryDto) {
        return this.studentsService.createCategory(dto);
    }

    @Get('categories')
    findAllCategories() {
        return this.studentsService.findAllCategories();
    }

    @Delete('categories/:id')
    removeCategory(@Param('id') id: string) {
        return this.studentsService.removeCategory(id);
    }

    // --- Houses ---

    @Post('houses')
    createHouse(@Body() dto: CreateStudentHouseDto) {
        return this.studentsService.createHouse(dto);
    }

    @Get('houses')
    findAllHouses() {
        return this.studentsService.findAllHouses();
    }

    @Delete('houses/:id')
    removeHouse(@Param('id') id: string) {
        return this.studentsService.removeHouse(id);
    }

    // --- Deactivate Reasons ---

    @Post('deactivate-reasons')
    createDeactivateReason(@Body() dto: CreateDeactivateReasonDto) {
        return this.studentsService.createDeactivateReason(dto);
    }

    @Get('deactivate-reasons/all')
    findAllDeactivateReasons() {
        return this.studentsService.findAllDeactivateReasons();
    }

    @Delete('deactivate-reasons/:id')
    removeDeactivateReason(@Param('id') id: string) {
        return this.studentsService.removeDeactivateReason(id);
    }

    // --- Online Admission ---

    @Post('online-admissions')
    createOnlineAdmission(@Body() dto: CreateOnlineAdmissionDto) {
        return this.studentsService.createOnlineAdmission(dto);
    }

    @Get('online-admissions')
    findAllOnlineAdmissions() {
        return this.studentsService.findAllOnlineAdmissions();
    }

    @Get('online-admissions/:id')
    findOneOnlineAdmission(@Param('id') id: string) {
        return this.studentsService.findOneOnlineAdmission(id);
    }

    @Patch('online-admissions/:id/status')
    updateOnlineAdmissionStatus(@Param('id') id: string, @Body() dto: UpdateOnlineAdmissionStatusDto) {
        return this.studentsService.updateOnlineAdmissionStatus(id, dto);
    }

    @Post('online-admissions/:id/approve')
    approveOnlineAdmission(@Param('id') id: string) {
        return this.studentsService.approveOnlineAdmission(id);
    }

    // --- Students (Generic Routes) ---

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.studentsService.findOne(id);
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
        @UploadedFiles() files: { studentPhoto?: Express.Multer.File[], documentFiles?: Express.Multer.File[] }
    ) {
        if (files?.studentPhoto && files.studentPhoto[0]) {
            updateStudentDto.studentPhoto = files.studentPhoto[0].path;
        }
        return this.studentsService.update(id, updateStudentDto, files?.documentFiles);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.studentsService.remove(id);
    }

    @Post('bulk/promote')
    promote(@Body() dto: { studentIds: string[], classId: string, sectionId?: string }) {
        return this.studentsService.promote(dto);
    }
}
