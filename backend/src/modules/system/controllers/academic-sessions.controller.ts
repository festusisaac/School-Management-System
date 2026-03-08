import { Controller, Get, Post, Body, Param, Put, Delete, ParseUUIDPipe } from '@nestjs/common';
import { AcademicSessionsService } from '../services/academic-sessions.service';
import { CreateAcademicSessionDto } from '../dtos/create-academic-session.dto';
import { UpdateAcademicSessionDto } from '../dtos/update-academic-session.dto';

@Controller('system/academic-sessions')
export class AcademicSessionsController {
    constructor(private readonly sessionsService: AcademicSessionsService) { }

    @Post()
    create(@Body() createDto: CreateAcademicSessionDto) {
        return this.sessionsService.create(createDto);
    }

    @Get()
    findAll() {
        return this.sessionsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.sessionsService.findOne(id);
    }

    @Put(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateAcademicSessionDto,
    ) {
        return this.sessionsService.update(id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.sessionsService.remove(id);
    }
}
