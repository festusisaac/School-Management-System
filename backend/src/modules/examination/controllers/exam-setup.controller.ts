import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ExamSetupService } from '../services/exam-setup.service';
import { CreateExamGroupDto, CreateAssessmentTypeDto, CreateGradeScaleDto, CreateExamDto, CreateExamScheduleDto, CreateAdmitCardTemplateDto } from '../dtos/setup/create-setup.dto';

@Controller('examination/setup')
export class ExamSetupController {
    constructor(private readonly setupService: ExamSetupService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/admit-cards',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = extname(file.originalname);
                cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
            }
        })
    }))
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        console.log('File uploaded:', file);
        return {
            url: `uploads/admit-cards/${file.filename}`
        };
    }

    @Post('groups')
    createGroup(@Body() dto: CreateExamGroupDto) {
        return this.setupService.createExamGroup(dto);
    }

    @Get('groups')
    getGroups() {
        return this.setupService.findAllExamGroups();
    }

    @Post('assessments')
    createAssessment(@Body() dto: CreateAssessmentTypeDto) {
        return this.setupService.createAssessmentType(dto);
    }

    @Get('assessments')
    getAssessments(@Query('examGroupId') examGroupId: string) {
        return this.setupService.getAssessmentTypes(examGroupId);
    }

    @Patch('assessments/:id')
    updateAssessment(@Param('id') id: string, @Body() dto: Partial<CreateAssessmentTypeDto>) {
        return this.setupService.updateAssessmentType(id, dto);
    }

    @Delete('assessments/:id')
    deleteAssessment(@Param('id') id: string) {
        return this.setupService.deleteAssessmentType(id);
    }

    @Post('grades')
    createGrade(@Body() dto: CreateGradeScaleDto) {
        return this.setupService.createGradeScale(dto);
    }

    @Get('grades')
    getGrades() {
        return this.setupService.getGradeScales();
    }

    @Patch('grades/:id')
    updateGrade(@Param('id') id: string, @Body() dto: Partial<CreateGradeScaleDto>) {
        return this.setupService.updateGradeScale(id, dto);
    }

    @Delete('grades/:id')
    deleteGrade(@Param('id') id: string) {
        return this.setupService.deleteGradeScale(id);
    }

    @Post('exams')
    createExam(@Body() dto: CreateExamDto) {
        return this.setupService.createExam(dto);
    }

    @Get('exams')
    getExams(@Query('examGroupId') examGroupId: string) {
        return this.setupService.getExams(examGroupId);
    }

    @Delete('exams/:id')
    deleteExam(@Param('id') id: string) {
        return this.setupService.deleteExam(id);
    }

    @Post('schedules')
    scheduleExam(@Body() dto: CreateExamScheduleDto) {
        return this.setupService.scheduleExam(dto);
    }

    @Get('schedules')
    getSchedule(@Query('examGroupId') examGroupId: string) {
        return this.setupService.getSchedule(examGroupId);
    }

    @Patch('schedules/:id')
    updateSchedule(@Param('id') id: string, @Body() dto: Partial<CreateExamScheduleDto>) {
        return this.setupService.updateSchedule(id, dto);
    }

    @Delete('schedules/:id')
    deleteSchedule(@Param('id') id: string) {
        return this.setupService.deleteSchedule(id);
    }

    // --- Admit Cards ---
    @Post('admit-cards')
    createAdmitCard(@Body() dto: CreateAdmitCardTemplateDto) {
        return this.setupService.createAdmitCardTemplate(dto);
    }

    @Get('admit-cards')
    getAdmitCards(@Query('examGroupId') examGroupId: string) {
        return this.setupService.getAdmitCardTemplates(examGroupId);
    }

    @Patch('admit-cards/:id')
    updateAdmitCard(@Param('id') id: string, @Body() dto: Partial<CreateAdmitCardTemplateDto>) {
        return this.setupService.updateAdmitCardTemplate(id, dto);
    }

    @Delete('admit-cards/:id')
    deleteAdmitCard(@Param('id') id: string) {
        return this.setupService.deleteAdmitCardTemplate(id);
    }

    @Post('psychomotor-domains')
    createPsychomotorDomain(@Body('name') name: string) {
        return this.setupService.createPsychomotorDomain(name);
    }

    @Get('psychomotor-domains')
    getPsychomotorDomains() {
        return this.setupService.getPsychomotorDomains();
    }

    @Patch('psychomotor-domains/:id')
    updatePsychomotorDomain(@Param('id') id: string, @Body('name') name: string) {
        return this.setupService.updatePsychomotorDomain(id, name);
    }

    @Delete('psychomotor-domains/:id')
    deletePsychomotorDomain(@Param('id') id: string) {
        return this.setupService.deletePsychomotorDomain(id);
    }

    @Post('affective-domains')
    createAffectiveDomain(@Body('name') name: string) {
        return this.setupService.createAffectiveDomain(name);
    }

    @Get('affective-domains')
    getAffectiveDomains() {
        return this.setupService.getAffectiveDomains();
    }

    @Patch('affective-domains/:id')
    updateAffectiveDomain(@Param('id') id: string, @Body('name') name: string) {
        return this.setupService.updateAffectiveDomain(id, name);
    }

    @Delete('affective-domains/:id')
    deleteAffectiveDomain(@Param('id') id: string) {
        return this.setupService.deleteAffectiveDomain(id);
    }

    @Patch('groups/:id')
    updateGroup(@Param('id') id: string, @Body() dto: Partial<CreateExamGroupDto>) {
        return this.setupService.updateExamGroup(id, dto);
    }

    @Delete('groups/:id')
    deleteGroup(@Param('id') id: string) {
        return this.setupService.deleteExamGroup(id);
    }
}

