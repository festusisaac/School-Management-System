import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { CbtQuestionService } from '../services/cbt-question.service';
import { CreateCbtQuestionDto, UpdateCbtQuestionDto, BulkImportQuestionsDto } from '../dtos/cbt/question.dto';

@UseGuards(JwtAuthGuard)
@Controller('examination/cbt/questions')
export class CbtQuestionController {
    constructor(private readonly questionService: CbtQuestionService) { }

    @Get()
    async findAll(@Query('examId') examId: string, @Request() req: any) {
        return this.questionService.findAll(examId, req.user.tenantId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req: any) {
        return this.questionService.findOne(id, req.user.tenantId);
    }

    @Post()
    async create(@Body() dto: CreateCbtQuestionDto, @Request() req: any) {
        return this.questionService.create(dto, req.user.tenantId);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateCbtQuestionDto, @Request() req: any) {
        return this.questionService.update(id, dto, req.user.tenantId);
    }

    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req: any) {
        return this.questionService.delete(id, req.user.tenantId);
    }

    @Post('bulk-import')
    async bulkImport(@Body() dto: BulkImportQuestionsDto, @Request() req: any) {
        return this.questionService.bulkImport(dto.examId, dto.data, req.user.tenantId);
    }
}
