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
import { DepartmentService } from '../services/department.service';
import { Department } from '../entities/department.entity';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('hr/departments')
@UseGuards(JwtAuthGuard)
export class DepartmentController {
    constructor(private readonly departmentService: DepartmentService) { }

    @Get()
    async findAll() {
        return this.departmentService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.departmentService.findOne(id);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() data: Partial<Department>) {
        return this.departmentService.create(data);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: Partial<Department>) {
        return this.departmentService.update(id, data);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        await this.departmentService.remove(id);
    }

    @Put(':id/head/:staffId')
    async assignHead(@Param('id') departmentId: string, @Param('staffId') staffId: string) {
        return this.departmentService.assignHead(departmentId, staffId);
    }
}
