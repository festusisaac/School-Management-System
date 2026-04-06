import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimetableService } from '../services/timetable.service';
import { JwtAuthGuard, RolesGuard } from '@guards/jwt-auth.guard';
import { Roles } from '@decorators/roles.decorator';
import { UserRole } from '@common/dtos/auth.dto';
import { Staff } from '@modules/hr/entities/staff.entity';
import { EntityManager } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { StudentsService } from '../../students/services/students.service';

@Controller('academics/timetable')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimetableController {
    constructor(
        private readonly timetableService: TimetableService,
        private readonly studentsService: StudentsService,
        @InjectRepository(Staff)
        private readonly staffRepository: Repository<Staff>,
        private readonly entityManager: EntityManager,
    ) { }

    // --- Period Management ---
    @Post('periods')
    @Roles(UserRole.ADMIN)
    createPeriod(@Body() body: any, @Request() req: any) {
        return this.timetableService.createPeriod({
            ...body,
            tenantId: req.user.tenantId,
        });
    }

    @Get('periods')
    getAllPeriods(@Request() req: any) {
        return this.timetableService.getAllPeriods(req.user.tenantId);
    }

    @Get('periods/initialize')
    @Roles(UserRole.ADMIN)
    initializeDefaultPeriods(@Request() req: any) {
        return this.timetableService.initializeDefaultPeriods(req.user.tenantId);
    }

    @Get('periods/:id')
    getPeriodById(@Param('id') id: string) {
        return this.timetableService.getPeriodById(id);
    }

    @Put('periods/:id')
    @Roles(UserRole.ADMIN)
    updatePeriod(@Param('id') id: string, @Body() body: any) {
        return this.timetableService.updatePeriod(id, body);
    }

    @Get('periods/reorder')
    @Roles(UserRole.ADMIN)
    reorderPeriods(@Body() body: { periodIds: string[] }, @Request() req: any) {
        return this.timetableService.reorderPeriods(req.user.tenantId, body.periodIds);
    }

    // --- Timetable Slot Management ---
    @Post('slots')
    @Roles(UserRole.ADMIN)
    createTimetableSlot(@Body() body: any, @Request() req: any) {
        return this.timetableService.createTimetableSlot({
            ...body,
            tenantId: req.user.tenantId,
        });
    }

    @Get('slots')
    async getTimetable(
        @Query('classId') classId: string,
        @Query('sectionId') sectionId: string,
        @Request() req: any
    ) {
        let resolvedClassId = classId;
        let resolvedSectionId = sectionId;

        // Data scoping for Students: Force their own class & section
        if (req.user.role === UserRole.STUDENT) {
            const resolvedStudentId = await this.studentsService.resolveStudentId(req.user.id, req.user.tenantId);
            if (!resolvedStudentId) return [];
            
            const student = await this.entityManager.getRepository(Student).findOne({
                where: { id: resolvedStudentId!, tenantId: req.user.tenantId }
            });
            if (student) {
                resolvedClassId = student.classId!;
                resolvedSectionId = student.sectionId!;
            } else {
                return [];
            }
        }

        // Data scoping for Teachers: Can only view timetables for assigned classes
        if (req.user.role === 'teacher' || req.user.role === UserRole.TEACHER) {
            const staffResult = await this.staffRepository.findOne({
                where: { email: req.user.email, tenantId: req.user.tenantId },
                select: ['id']
            });

            if (!staffResult) return [];

            const staffId = staffResult.id;

            // Check if teacher is assigned to this class (as class teacher or subject teacher)
            const classCheck = await this.staffRepository.query(
                `SELECT 1 FROM "classes" WHERE "id" = $1 AND "classTeacherId" = $2 AND "tenantId" = $3
                 UNION
                 SELECT 1 FROM "subject_teachers" WHERE "classId" = $1 AND "teacherId" = $2 AND "tenantId" = $3`,
                [resolvedClassId, staffId, req.user.tenantId]
            );

            if (!classCheck || classCheck.length === 0) {
                return []; // Block access to other classes
            }
        }

        return this.timetableService.getTimetable(resolvedClassId, resolvedSectionId, req.user.tenantId);
    }

    @Get('slots/teacher/today')
    async getMyTodayTimetable(@Request() req: any) {
        const staff = await this.staffRepository.findOne({
            where: { email: req.user.email, tenantId: req.user.tenantId },
        });
        if (!staff) {
            return [];
        }
        return this.timetableService.getTeacherTodayTimetable(staff.id, req.user.tenantId);
    }

    @Get('slots/teacher/:teacherId')
    async getTeacherTimetable(@Param('teacherId') teacherId: string, @Request() req: any) {
        if (req.user.role === UserRole.TEACHER) {
            const staff = await this.staffRepository.findOne({
                where: { email: req.user.email, tenantId: req.user.tenantId },
                select: ['id']
            });
            
            if (!staff || staff.id !== teacherId) {
                return [];
            }
        }
        
        return this.timetableService.getTeacherTimetable(teacherId, req.user.tenantId);
    }

    @Get('slots/:id')
    getTimetableSlotById(@Param('id') id: string) {
        return this.timetableService.getTimetableSlotById(id);
    }

    @Put('slots/:id')
    @Roles(UserRole.ADMIN)
    updateTimetableSlot(@Param('id') id: string, @Body() body: any) {
        return this.timetableService.updateTimetableSlot(id, body);
    }

    @Delete('slots/:id')
    @Roles(UserRole.ADMIN)
    async deleteTimetableSlot(@Param('id') id: string) {
        await this.timetableService.deleteTimetableSlot(id);
        return { message: 'Timetable slot deleted successfully' };
    }

    @Delete('slots/clear')
    @Roles(UserRole.ADMIN)
    async clearTimetable(
        @Query('classId') classId: string,
        @Query('sectionId') sectionId: string,
        @Request() req: any
    ) {
        await this.timetableService.clearTimetable(classId, sectionId, req.user.tenantId);
        return { message: 'Timetable cleared successfully' };
    }

    @Post('slots/bulk')
    @Roles(UserRole.ADMIN)
    saveTimetableBulk(
        @Body() body: {
            classId: string;
            sectionId: string;
            slots: Array<{ dayOfWeek: number; periodId: string; subjectId: string; teacherId?: string; roomNumber?: string }>;
        },
        @Request() req: any
    ) {
        return this.timetableService.saveTimetableBulk(
            body.classId,
            body.sectionId,
            req.user.tenantId,
            body.slots
        );
    }

    @Post('slots/copy')
    @Roles(UserRole.ADMIN)
    copyTimetable(
        @Body() body: {
            sourceClassId: string;
            sourceSectionId: string;
            targetClassId: string;
            targetSectionId: string;
        },
        @Request() req: any
    ) {
        return this.timetableService.copyTimetable(
            body.sourceClassId,
            body.sourceSectionId,
            body.targetClassId,
            body.targetSectionId,
            req.user.tenantId
        );
    }
}
