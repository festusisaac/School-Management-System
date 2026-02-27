import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '@guards/jwt-auth.guard';
import { Roles } from '@decorators/roles.decorator';
import { UserRole } from '@common/dtos/auth.dto';
import { ClassSubjectService } from '../services/class-subject.service';
import { CreateClassSubjectDto, BulkAssignClassSubjectsDto, UpdateClassSubjectDto } from '../dto/class-subject.dto';

@Controller('academics/assign-class-subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassSubjectController {
    constructor(private readonly classSubjectService: ClassSubjectService) { }

    @Get('class/:classId')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async findByClass(
        @Param('classId') classId: string,
        @Request() req: any,
        @Query('sectionId') sectionId?: string,
    ) {
        return this.classSubjectService.findByClass(classId, req.user.tenantId, sectionId);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async findOne(@Param('id') id: string, @Request() req: any) {
        return this.classSubjectService.findOne(id, req.user.tenantId);
    }

    @Post()
    @Roles(UserRole.ADMIN)
    async create(@Body() dto: CreateClassSubjectDto, @Request() req: any) {
        return this.classSubjectService.create(dto, req.user.tenantId);
    }

    @Post('bulk')
    @Roles(UserRole.ADMIN)
    async bulkAssign(@Body() dto: BulkAssignClassSubjectsDto, @Request() req: any) {
        return this.classSubjectService.bulkAssign(dto, req.user.tenantId);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateClassSubjectDto,
        @Request() req: any,
    ) {
        return this.classSubjectService.update(id, dto, req.user.tenantId);
    }

    @Patch(':id/toggle')
    @Roles(UserRole.ADMIN)
    async toggleStatus(@Param('id') id: string, @Request() req: any) {
        return this.classSubjectService.toggleStatus(id, req.user.tenantId);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    async delete(@Param('id') id: string, @Request() req: any) {
        await this.classSubjectService.delete(id, req.user.tenantId);
        return { message: 'Class subject deleted successfully' };
    }
}
