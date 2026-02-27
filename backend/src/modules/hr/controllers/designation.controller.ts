import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { DesignationService } from '../services/designation.service';
import { Designation } from '../entities/designation.entity';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('hr/designations')
@UseGuards(JwtAuthGuard)
export class DesignationController {
    constructor(private readonly designationService: DesignationService) { }

    @Get()
    async findAll() {
        return this.designationService.findAll();
    }

    @Get('hierarchy')
    async getHierarchy() {
        return this.designationService.getHierarchy();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.designationService.findOne(id);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() data: Partial<Designation>) {
        return this.designationService.create(data);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: Partial<Designation>) {
        return this.designationService.update(id, data);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        await this.designationService.remove(id);
    }
}
