import { Controller, Post, Body, Get, Query, UseGuards, Request } from '@nestjs/common';
import { SubjectTeacherService } from '../services/subject-teacher.service';
import { AssignSubjectTeachersDto } from '../dto/assign-subject-teacher.dto';
import { JwtAuthGuard, RolesGuard } from '@guards/jwt-auth.guard';
import { Roles } from '@decorators/roles.decorator';
import { UserRole } from '@common/dtos/auth.dto';

@Controller('academics/subject-teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectTeacherController {
    constructor(private readonly subjectTeacherService: SubjectTeacherService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.PRINCIPAL)
    async assignTeachers(@Body() dto: AssignSubjectTeachersDto, @Request() req: any) {
        return this.subjectTeacherService.assignTeachers(dto, req.user.tenantId);
    }

    @Get()
    async getTeachersForSection(
        @Query('sectionId') sectionId: string,
        @Request() req: any,
    ) {
        return this.subjectTeacherService.getTeachersForSection(sectionId, req.user.tenantId);
    }
}
