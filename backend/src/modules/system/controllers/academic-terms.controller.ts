import { Controller, Get, Post, Body, Param, Put, Delete, ParseUUIDPipe } from '@nestjs/common';
import { AcademicTermsService } from '../services/academic-terms.service';
import { CreateAcademicTermDto } from '../dtos/create-academic-term.dto';
import { UpdateAcademicTermDto } from '../dtos/update-academic-term.dto';

@Controller('system/academic-terms')
export class AcademicTermsController {
    constructor(private readonly termsService: AcademicTermsService) { }

    @Post()
    create(@Body() createDto: CreateAcademicTermDto) {
        return this.termsService.create(createDto);
    }

    @Get()
    findAll() {
        return this.termsService.findAll();
    }

    @Get('session/:sessionId')
    findAllBySession(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
        return this.termsService.findAllBySession(sessionId);
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.termsService.findOne(id);
    }

    @Put(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateAcademicTermDto,
    ) {
        return this.termsService.update(id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.termsService.remove(id);
    }
}
