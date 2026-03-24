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
    Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ExamSetupService } from '../services/exam-setup.service';
import { CreateExamGroupDto, CreateAssessmentTypeDto, CreateGradeScaleDto, CreateExamDto, CreateExamScheduleDto, CreateAdmitCardTemplateDto } from '../dtos/setup/create-setup.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
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
    createGroup(@Body() dto: CreateExamGroupDto, @Request() req: any) {
        return this.setupService.createExamGroup(dto, req.user.tenantId);
    }

    @Get('groups')
    getGroups(@Request() req: any) {
        return this.setupService.findAllExamGroups(req.user.tenantId);
    }

    @Post('assessments')
    createAssessment(@Body() dto: CreateAssessmentTypeDto, @Request() req: any) {
        return this.setupService.createAssessmentType(dto, req.user.tenantId);
    }

    @Get('assessments')
    getAssessments(@Query('examGroupId') examGroupId: string, @Request() req: any) {
        return this.setupService.getAssessmentTypes(examGroupId, req.user.tenantId);
    }

    @Patch('assessments/:id')
    updateAssessment(@Param('id') id: string, @Body() dto: Partial<CreateAssessmentTypeDto>, @Request() req: any) {
        return this.setupService.updateAssessmentType(id, dto, req.user.tenantId);
    }

    @Delete('assessments/:id')
    deleteAssessment(@Param('id') id: string, @Request() req: any) {
        return this.setupService.deleteAssessmentType(id, req.user.tenantId);
    }

    @Post('grades')
    createGrade(@Body() dto: CreateGradeScaleDto, @Request() req: any) {
        return this.setupService.createGradeScale(dto, req.user.tenantId);
    }

    @Get('grades')
    getGrades(@Request() req: any) {
        return this.setupService.getGradeScales(req.user.tenantId);
    }

    @Patch('grades/:id')
    updateGrade(@Param('id') id: string, @Body() dto: Partial<CreateGradeScaleDto>, @Request() req: any) {
        return this.setupService.updateGradeScale(id, dto, req.user.tenantId);
    }

    @Delete('grades/:id')
    deleteGrade(@Param('id') id: string, @Request() req: any) {
        return this.setupService.deleteGradeScale(id, req.user.tenantId);
    }

    @Post('exams')
    createExam(@Body() dto: CreateExamDto, @Request() req: any) {
        return this.setupService.createExam(dto, req.user.tenantId);
    }

    @Get('exams')
    getExams(@Query('examGroupId') examGroupId: string, @Request() req: any) {
        return this.setupService.getExams(examGroupId, req.user.tenantId);
    }

    @Patch('exams/:id')
    updateExam(@Param('id') id: string, @Body() dto: Partial<CreateExamDto>, @Request() req: any) {
        return this.setupService.updateExam(id, dto, req.user.tenantId);
    }

    @Delete('exams/:id')
    deleteExam(@Param('id') id: string, @Request() req: any) {
        return this.setupService.deleteExam(id, req.user.tenantId);
    }

    @Post('schedules')
    scheduleExam(@Body() dto: CreateExamScheduleDto, @Request() req: any) {
        return this.setupService.scheduleExam(dto, req.user.tenantId);
    }

    @Get('schedules')
    getSchedule(@Query('examGroupId') examGroupId: string, @Request() req: any) {
        return this.setupService.getSchedule(examGroupId, req.user.tenantId);
    }

    @Patch('schedules/:id')
    updateSchedule(@Param('id') id: string, @Body() dto: Partial<CreateExamScheduleDto>, @Request() req: any) {
        return this.setupService.updateSchedule(id, dto, req.user.tenantId);
    }

    @Delete('schedules/:id')
    deleteSchedule(@Param('id') id: string, @Request() req: any) {
        return this.setupService.deleteSchedule(id, req.user.tenantId);
    }

    // --- Admit Cards ---
    @Post('admit-cards')
    createAdmitCard(@Body() dto: CreateAdmitCardTemplateDto, @Request() req: any) {
        return this.setupService.createAdmitCardTemplate(dto, req.user.tenantId);
    }

    @Get('admit-cards')
    getAdmitCards(@Query('examGroupId') examGroupId: string, @Request() req: any) {
        return this.setupService.getAdmitCardTemplates(examGroupId, req.user.tenantId);
    }

    @Patch('admit-cards/:id')
    updateAdmitCard(@Param('id') id: string, @Body() dto: Partial<CreateAdmitCardTemplateDto>, @Request() req: any) {
        return this.setupService.updateAdmitCardTemplate(id, dto, req.user.tenantId);
    }

    @Delete('admit-cards/:id')
    deleteAdmitCard(@Param('id') id: string, @Request() req: any) {
        return this.setupService.deleteAdmitCardTemplate(id, req.user.tenantId);
    }

    @Post('psychomotor-domains')
    createPsychomotorDomain(@Body('name') name: string, @Request() req: any) {
        return this.setupService.createPsychomotorDomain(name, req.user.tenantId);
    }

    @Get('psychomotor-domains')
    getPsychomotorDomains(@Request() req: any) {
        return this.setupService.getPsychomotorDomains(req.user.tenantId);
    }

    @Patch('psychomotor-domains/:id')
    updatePsychomotorDomain(@Param('id') id: string, @Body('name') name: string, @Request() req: any) {
        return this.setupService.updatePsychomotorDomain(id, name, req.user.tenantId);
    }

    @Delete('psychomotor-domains/:id')
    deletePsychomotorDomain(@Param('id') id: string, @Request() req: any) {
        return this.setupService.deletePsychomotorDomain(id, req.user.tenantId);
    }

    @Post('affective-domains')
    createAffectiveDomain(@Body('name') name: string, @Request() req: any) {
        return this.setupService.createAffectiveDomain(name, req.user.tenantId);
    }

    @Get('affective-domains')
    getAffectiveDomains(@Request() req: any) {
        return this.setupService.getAffectiveDomains(req.user.tenantId);
    }

    @Patch('affective-domains/:id')
    updateAffectiveDomain(@Param('id') id: string, @Body('name') name: string, @Request() req: any) {
        return this.setupService.updateAffectiveDomain(id, name, req.user.tenantId);
    }

    @Delete('affective-domains/:id')
    deleteAffectiveDomain(@Param('id') id: string, @Request() req: any) {
        return this.setupService.deleteAffectiveDomain(id, req.user.tenantId);
    }

    @Patch('groups/:id')
    updateGroup(@Param('id') id: string, @Body() dto: Partial<CreateExamGroupDto>, @Request() req: any) {
        return this.setupService.updateExamGroup(id, dto, req.user.tenantId);
    }

    @Delete('groups/:id')
    deleteGroup(@Param('id') id: string, @Request() req: any) {
        return this.setupService.deleteExamGroup(id, req.user.tenantId);
    }
}
