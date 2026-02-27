import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { SchoolSectionService } from '../services/school-section.service';

@Controller('academics/school-sections')
@UseGuards(JwtAuthGuard)
export class SchoolSectionController {
    constructor(private readonly schoolSectionService: SchoolSectionService) { }

    @Get()
    async findAll(@Request() req: any) {
        return this.schoolSectionService.findAll(req.user.tenantId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req: any) {
        return this.schoolSectionService.findOne(id, req.user.tenantId);
    }

    @Post()
    async create(@Body() data: any, @Request() req: any) {
        return this.schoolSectionService.create(data, req.user.tenantId);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: any, @Request() req: any) {
        return this.schoolSectionService.update(id, data, req.user.tenantId);
    }

    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req: any) {
        return this.schoolSectionService.delete(id, req.user.tenantId);
    }

    @Patch(':id/toggle')
    async toggleStatus(@Param('id') id: string, @Request() req: any) {
        return this.schoolSectionService.toggleStatus(id, req.user.tenantId);
    }
}
