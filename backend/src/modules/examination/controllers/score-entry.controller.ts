import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ScoreEntryService } from '../services/score-entry.service';
import { SaveMarksDto, SaveSkillsDto, SavePsychomotorDto } from '../dtos/entry/score-entry.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('examination/entry')
export class ScoreEntryController {
    constructor(private readonly entryService: ScoreEntryService) { }

    @Post('marks')
    saveMarks(@Body() dto: SaveMarksDto, @Request() req: any) {
        return this.entryService.saveMarks(dto, req.user.tenantId);
    }

    @Get('marks/:examId')
    getMarks(@Param('examId') examId: string, @Request() req: any, @Query('assessmentTypeId') assessmentTypeId?: string) {
        return this.entryService.getMarks(examId, req.user.tenantId, assessmentTypeId);
    }

    @Get('class-marks/:classId/:examGroupId')
    getClassMarks(@Param('classId') classId: string, @Param('examGroupId') examGroupId: string, @Request() req: any) {
        return this.entryService.getClassMarks(classId, examGroupId, req.user.tenantId);
    }

    @Post('skills')
    saveSkills(@Body() dto: SaveSkillsDto, @Request() req: any) {
        return this.entryService.saveSkills(dto, req.user.tenantId);
    }

    @Get('skills/:examGroupId')
    getSkills(@Param('examGroupId') examGroupId: string, @Request() req: any) {
        return this.entryService.getSkills(examGroupId, req.user.tenantId);
    }

    @Post('psychomotor')
    savePsychomotor(@Body() dto: SavePsychomotorDto, @Request() req: any) {
        return this.entryService.savePsychomotor(dto, req.user.tenantId);
    }

    @Get('psychomotor/:examGroupId')
    getPsychomotor(@Param('examGroupId') examGroupId: string, @Request() req: any) {
        return this.entryService.getPsychomotor(examGroupId, req.user.tenantId);
    }
}

