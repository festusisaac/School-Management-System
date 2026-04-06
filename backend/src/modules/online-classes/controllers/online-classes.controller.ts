import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OnlineClassesService } from '../services/online-classes.service';
import { CreateOnlineClassDto } from '../dto/create-online-class.dto';
import { UpdateOnlineClassDto } from '../dto/update-online-class.dto';
import { JwtAuthGuard, RolesGuard } from '@guards/jwt-auth.guard';
import { OnlineClassStatus } from '../entities/online-class.entity';
import { StaffService } from '@modules/hr/services/staff.service';
import { UserRole } from '@common/dtos/auth.dto';
import { EntityManager } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { StudentsService } from '../../students/services/students.service';

@ApiTags('Online Classes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('online-classes')
export class OnlineClassesController {
    constructor(
        private readonly onlineClassesService: OnlineClassesService,
        private readonly staffService: StaffService,
        private readonly studentsService: StudentsService,
        private readonly entityManager: EntityManager,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Create a new online class' })
    create(@Body() createDto: CreateOnlineClassDto, @Request() req: any) {
        return this.onlineClassesService.create(createDto, req.user.tenantId);
    }

    @Get()
    @ApiOperation({ summary: 'Get all online classes with filters' })
    async findAll(
        @Request() req: any,
        @Query('classId') classId?: string,
        @Query('subjectId') subjectId?: string,
        @Query('teacherId') teacherId?: string,
        @Query('status') status?: OnlineClassStatus,
    ) {
        let resolvedTeacherId = teacherId;
        let resolvedClassId = classId;

        // Data scoping for Students: Force their own classId
        if (req.user.role === UserRole.STUDENT) {
            const resolvedStudentId = await this.studentsService.resolveStudentId(req.user.id, req.user.tenantId);
            if (!resolvedStudentId) return [];
            
            const student = await this.entityManager.getRepository(Student).findOne({
                where: { id: resolvedStudentId!, tenantId: req.user.tenantId }
            });
            if (student) {
                resolvedClassId = student.classId;
            } else {
                return [];
            }
        }

        // If user is a teacher, force filter by their staffId
        if (req.user.role === UserRole.TEACHER) {
            resolvedTeacherId = await this.staffService.resolveStaffIdByEmail(req.user.email, req.user.tenantId);
        }
        return this.onlineClassesService.findAll(req.user.tenantId, { classId: resolvedClassId, subjectId, teacherId: resolvedTeacherId, status });
    }

    @Get('upcoming')
    @ApiOperation({ summary: 'Get upcoming online classes' })
    async findUpcoming(@Request() req: any, @Query('classId') classId?: string) {
        let resolvedTeacherId: string | undefined;
        let resolvedClassId = classId;

        // Data scoping for Students: Force their own classId
        if (req.user.role === UserRole.STUDENT) {
            const resolvedStudentId = await this.studentsService.resolveStudentId(req.user.id, req.user.tenantId);
            if (!resolvedStudentId) return [];
            
            const student = await this.entityManager.getRepository(Student).findOne({
                where: { id: resolvedStudentId!, tenantId: req.user.tenantId }
            });
            if (student) {
                resolvedClassId = student.classId;
            } else {
                return [];
            }
        }

        // If user is a teacher, force filter by their staffId
        if (req.user.role === UserRole.TEACHER) {
            resolvedTeacherId = await this.staffService.resolveStaffIdByEmail(req.user.email, req.user.tenantId);
        }
        return this.onlineClassesService.findUpcoming(req.user.tenantId, resolvedClassId, resolvedTeacherId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific online class' })
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.onlineClassesService.findOne(id, req.user.tenantId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an online class' })
    update(@Param('id') id: string, @Body() updateDto: UpdateOnlineClassDto, @Request() req: any) {
        return this.onlineClassesService.update(id, updateDto, req.user.tenantId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an online class' })
    remove(@Param('id') id: string, @Request() req: any) {
        return this.onlineClassesService.remove(id, req.user.tenantId);
    }
}
