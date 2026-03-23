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
    Request,
} from '@nestjs/common';
import { DepartmentService } from '../services/department.service';
import { Department } from '../entities/department.entity';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('hr/departments')
@UseGuards(JwtAuthGuard)
export class DepartmentController {
    constructor(private readonly departmentService: DepartmentService) { }

    @Get()
    async findAll(@Request() req: any) {
        return this.departmentService.findAll(req.user.tenantId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req: any) {
        return this.departmentService.findOne(id, req.user.tenantId);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() data: Partial<Department>, @Request() req: any) {
        return this.departmentService.create(data, req.user.tenantId);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: Partial<Department>, @Request() req: any) {
        return this.departmentService.update(id, data, req.user.tenantId);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string, @Request() req: any) {
        await this.departmentService.remove(id, req.user.tenantId);
    }

    @Put(':id/head/:staffId')
    async assignHead(@Param('id') departmentId: string, @Param('staffId') staffId: string, @Request() req: any) {
        return this.departmentService.assignHead(departmentId, staffId, req.user.tenantId);
    }
}
