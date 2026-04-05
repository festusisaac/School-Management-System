import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Patch,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AcademicsService } from '../services/academics.service';
import { JwtAuthGuard, RolesGuard } from '@guards/jwt-auth.guard';
import { Roles } from '@decorators/roles.decorator';
import { Public } from '@decorators/public.decorator';
import { UserRole } from '@common/dtos/auth.dto';
import { CreateClassDto, UpdateClassDto } from '../dtos/class.dto';
import { CreateSectionDto, UpdateSectionDto } from '../dtos/section.dto';
import { StaffService } from '@modules/hr/services/staff.service';
import { EntityManager } from 'typeorm';

@Controller('academics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicsController {
    constructor(
        private readonly academicsService: AcademicsService,
        private readonly staffService: StaffService,
        private readonly entityManager: EntityManager,
    ) { }

    // --- Classes ---
    @Post('classes')
    @Roles(UserRole.ADMIN)
    createClass(@Body() createClassDto: CreateClassDto, @Request() req: any) {
        return this.academicsService.createClass({
            ...createClassDto,
            tenantId: req.user.tenantId,
        });
    }

    @Get('classes')
    async getAllClasses(@Request() req: any) {
        let teacherId: string | undefined;
        // If user is a teacher, only get their assigned classes
        if (req.user.role === UserRole.TEACHER) {
            teacherId = await this.staffService.resolveStaffIdByEmail(req.user.email, req.user.tenantId);
        }
        return this.academicsService.getAllClasses(req.user.tenantId, teacherId);
    }

    @Public()
    @Get('public/classes')
    async getPublicClasses() {
        // Resolve tenantId from the first super admin, then fallback to any user, then any class
        let result = await this.entityManager.query('SELECT "tenantId" FROM "users" WHERE "role" ILIKE \'%Super Administrator%\' LIMIT 1');
        
        let tenantId = result[0]?.tenantId;
        
        if (!tenantId) {
            result = await this.entityManager.query('SELECT "tenantId" FROM "users" LIMIT 1');
            tenantId = result[0]?.tenantId;
        }

        if (!tenantId) {
            result = await this.entityManager.query('SELECT "tenantId" FROM "classes" LIMIT 1');
            tenantId = result[0]?.tenantId;
        }

        if (!tenantId) return [];
        return this.academicsService.getAllClasses(tenantId);
    }

    @Get('classes/:id')
    getClassById(@Param('id') id: string) {
        return this.academicsService.getClassById(id);
    }

    @Put('classes/:id')
    @Roles(UserRole.ADMIN)
    updateClass(@Param('id') id: string, @Body() updateClassDto: UpdateClassDto) {
        return this.academicsService.updateClass(id, updateClassDto);
    }

    @Delete('classes/:id')
    @Roles(UserRole.ADMIN)
    async deleteClass(@Param('id') id: string) {
        await this.academicsService.deleteClass(id);
        return { message: 'Class deleted successfully' };
    }

    @Patch('classes/:id/toggle-status')
    @Roles(UserRole.ADMIN)
    toggleClassStatus(@Param('id') id: string) {
        return this.academicsService.toggleClassStatus(id);
    }

    // --- Sections ---
    @Post('sections')
    @Roles(UserRole.ADMIN)
    createSection(@Body() createSectionDto: CreateSectionDto, @Request() req: any) {
        return this.academicsService.createSection({
            ...createSectionDto,
            tenantId: req.user.tenantId,
        });
    }

    @Get('sections')
    async getAllSections(@Request() req: any) {
        let teacherId: string | undefined;
        // If user is a teacher, only get their assigned sections
        if (req.user.role === UserRole.TEACHER) {
            teacherId = await this.staffService.resolveStaffIdByEmail(req.user.email, req.user.tenantId);
        }
        return this.academicsService.getAllSections(req.user.tenantId, teacherId);
    }

    @Get('sections/:id')
    getSectionById(@Param('id') id: string) {
        return this.academicsService.getSectionById(id);
    }

    @Put('sections/:id')
    @Roles(UserRole.ADMIN)
    updateSection(@Param('id') id: string, @Body() updateSectionDto: UpdateSectionDto) {
        return this.academicsService.updateSection(id, updateSectionDto);
    }

    @Delete('sections/:id')
    @Roles(UserRole.ADMIN)
    async deleteSection(@Param('id') id: string) {
        await this.academicsService.deleteSection(id);
        return { message: 'Section deleted successfully' };
    }

    @Patch('sections/:id/toggle-status')
    @Roles(UserRole.ADMIN)
    toggleSectionStatus(@Param('id') id: string) {
        return this.academicsService.toggleSectionStatus(id);
    }

    // --- Subjects ---
    @Post('subjects')
    @Roles(UserRole.ADMIN)
    createSubject(@Body() body: any, @Request() req: any) {
        return this.academicsService.createSubject({
            ...body,
            tenantId: req.user.tenantId,
        });
    }

    @Get('subjects')
    getAllSubjects(@Request() req: any) {
        return this.academicsService.getAllSubjects(req.user.tenantId);
    }

    @Get('subjects/:id')
    getSubjectById(@Param('id') id: string) {
        return this.academicsService.getSubjectById(id);
    }

    @Put('subjects/:id')
    @Roles(UserRole.ADMIN)
    updateSubject(@Param('id') id: string, @Body() body: any) {
        return this.academicsService.updateSubject(id, body);
    }

    @Delete('subjects/:id')
    @Roles(UserRole.ADMIN)
    async deleteSubject(@Param('id') id: string) {
        await this.academicsService.deleteSubject(id);
        return { message: 'Subject deleted successfully' };
    }

    @Patch('subjects/:id/toggle-status')
    @Roles(UserRole.ADMIN)
    toggleSubjectStatus(@Param('id') id: string) {
        return this.academicsService.toggleSubjectStatus(id);
    }

    // --- Subject Groups ---
    @Post('subject-groups')
    @Roles(UserRole.ADMIN)
    createSubjectGroup(@Body() body: any, @Request() req: any) {
        return this.academicsService.createSubjectGroup({
            ...body,
            tenantId: req.user.tenantId,
        });
    }

    @Get('subject-groups')
    getAllSubjectGroups(@Request() req: any) {
        return this.academicsService.getAllSubjectGroups(req.user.tenantId);
    }

    @Get('subject-groups/:id')
    getSubjectGroupById(@Param('id') id: string) {
        return this.academicsService.getSubjectGroupById(id);
    }

    @Put('subject-groups/:id')
    @Roles(UserRole.ADMIN)
    updateSubjectGroup(@Param('id') id: string, @Body() body: any) {
        return this.academicsService.updateSubjectGroup(id, body);
    }

    @Delete('subject-groups/:id')
    @Roles(UserRole.ADMIN)
    async deleteSubjectGroup(@Param('id') id: string) {
        await this.academicsService.deleteSubjectGroup(id);
        return { message: 'Subject Group deleted successfully' };
    }

    @Patch('subject-groups/:id/toggle-status')
    @Roles(UserRole.ADMIN)
    toggleSubjectGroupStatus(@Param('id') id: string) {
        return this.academicsService.toggleSubjectGroupStatus(id);
    }

    // --- Class Teacher Assignment ---
    @Post('sections/:id/assign-teacher')
    @Roles(UserRole.ADMIN)
    assignClassTeacher(@Param('id') id: string, @Body() body: { teacherId: string }) {
        return this.academicsService.assignClassTeacher(id, body.teacherId);
    }

    @Delete('sections/:id/remove-teacher')
    @Roles(UserRole.ADMIN)
    async removeClassTeacher(@Param('id') id: string) {
        await this.academicsService.removeClassTeacher(id);
        return { message: 'Class teacher removed successfully' };
    }

    // --- Direct Class Teacher Assignment ---
    @Post('classes/:id/assign-teacher')
    @Roles(UserRole.ADMIN)
    assignClassTeacherDirect(@Param('id') id: string, @Body() body: { teacherId: string }) {
        return this.academicsService.assignClassTeacherDirect(id, body.teacherId);
    }

    @Delete('classes/:id/remove-teacher')
    @Roles(UserRole.ADMIN)
    async removeClassTeacherDirect(@Param('id') id: string) {
        await this.academicsService.removeClassTeacherDirect(id);
        return { message: 'Class teacher removed successfully' };
    }


}
