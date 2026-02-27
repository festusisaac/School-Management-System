import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ScoreEntryService } from '../services/score-entry.service';
import { SaveMarksDto, SaveSkillsDto, SavePsychomotorDto } from '../dtos/entry/score-entry.dto';

@Controller('examination/entry')
export class ScoreEntryController {
    constructor(private readonly entryService: ScoreEntryService) { }

    @Post('marks')
    saveMarks(@Body() dto: SaveMarksDto) {
        return this.entryService.saveMarks(dto);
    }

    @Get('marks/:examId')
    getMarks(@Param('examId') examId: string, @Query('assessmentTypeId') assessmentTypeId?: string) {
        return this.entryService.getMarks(examId, assessmentTypeId);
    }

    @Post('skills')
    saveSkills(@Body() dto: SaveSkillsDto) {
        return this.entryService.saveSkills(dto);
    }

    @Get('skills/:examGroupId')
    getSkills(@Param('examGroupId') examGroupId: string) {
        return this.entryService.getSkills(examGroupId);
    }

    @Post('psychomotor')
    savePsychomotor(@Body() dto: SavePsychomotorDto) {
        return this.entryService.savePsychomotor(dto);
    }

    @Get('psychomotor/:examGroupId')
    getPsychomotor(@Param('examGroupId') examGroupId: string) {
        return this.entryService.getPsychomotor(examGroupId);
    }
}

