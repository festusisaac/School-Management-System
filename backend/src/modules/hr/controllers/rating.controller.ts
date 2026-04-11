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
    HttpCode,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import { RatingService } from '../services/rating.service';
import { CreateTeacherRatingDto, UpdateTeacherRatingDto } from '../dto/teacher-rating.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { CurrentUser } from '../../../decorators/current-user.decorator';
import { StudentsService } from '../../students/services/students.service';
import { AcademicsService } from '../../academics/services/academics.service';
import { SubjectTeacherService } from '../../academics/services/subject-teacher.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

@Controller('hr/ratings')
@UseGuards(JwtAuthGuard)
export class RatingController {
    constructor(
        private readonly ratingService: RatingService,
        private readonly studentsService: StudentsService,
        private readonly academicsService: AcademicsService,
        private readonly subjectTeacherService: SubjectTeacherService,
    ) { }

    @Get('my-teachers')
    async getMyTeachers(
        @CurrentUser('id') userId: string,
        @CurrentUser('role') role: string,
        @CurrentUser('tenantId') tenantId: string,
        @Query('studentId') studentId?: string,
    ) {
        let student: any;

        if (role === 'parent') {
            if (!studentId) {
                throw new BadRequestException('Student ID is required for parents');
            }
            // Verify parent-child relationship
            const children = await this.studentsService.getMyChildren(userId, tenantId);
            student = children.find(c => c.id === studentId);
            if (!student) {
                throw new ForbiddenException('You can only view teachers for your own children.');
            }
        } else if (role === 'student') {
            student = await this.studentsService.findByUserId(userId);
            if (!student) {
                throw new NotFoundException('Student record not found');
            }
        } else {
            throw new ForbiddenException('Only students and parents can view assigned teachers for rating.');
        }

        const classId = student.classId;
        const sectionId = student.sectionId;

        if (!classId) {
            return [];
        }

        // 1. Get Subject Teachers
        const subjectTeachers = await this.subjectTeacherService.getTeachersForClassOrSection(
            tenantId,
            classId,
            sectionId || undefined
        );

        // 2. Get Class Teacher
        let classTeacher = null;
        if (sectionId) {
            const section = await this.academicsService.getSectionById(sectionId);
            classTeacher = section.classTeacher;
        } else {
            const cls = await this.academicsService.getClassById(classId);
            classTeacher = cls.classTeacher;
        }

        // 3. Consolidate and format
        const teachersMap = new Map<string, any>();

        // Add class teacher first
        if (classTeacher) {
            teachersMap.set(classTeacher.id, {
                id: classTeacher.id,
                name: `${classTeacher.firstName} ${classTeacher.lastName}`,
                photo: classTeacher.photo,
                role: 'Class Teacher',
                subjects: []
            });
        }

        // Add subject teachers
        for (const st of subjectTeachers) {
            if (!st.teacher) continue;
            
            const existing = teachersMap.get(st.teacher.id);
            if (existing) {
                if (!existing.subjects.includes(st.subject.name)) {
                    existing.subjects.push(st.subject.name);
                }
            } else {
                teachersMap.set(st.teacher.id, {
                    id: st.teacher.id,
                    name: `${st.teacher.firstName} ${st.teacher.lastName}`,
                    photo: st.teacher.photo,
                    role: 'Subject Teacher',
                    subjects: [st.subject.name]
                });
            }
        }

        return Array.from(teachersMap.values());
    }

    @Get()
    async findAll(
        @Query('academicYear') academicYear?: string,
        @Query('term') term?: string,
    ) {
        return this.ratingService.findAll({ academicYear, term });
    }

    @Get('teacher/:teacherId')
    async findByTeacher(@Param('teacherId') teacherId: string) {
        return this.ratingService.getTeacherRatings(teacherId);
    }

    @Get('teacher/:teacherId/average')
    async getAverage(@Param('teacherId') teacherId: string) {
        return this.ratingService.getAverageRating(teacherId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.ratingService.findOne(id);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() createDto: CreateTeacherRatingDto & { studentId?: string },
        @CurrentUser('id') userId: string,
        @CurrentUser('role') role: string,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        let studentId = createDto.studentId;

        if (role === 'parent') {
            if (!studentId) {
                throw new BadRequestException('Student ID is required for parents to rate teachers');
            }
            // Verify parent-child relationship
            const children = await this.studentsService.getMyChildren(userId, tenantId);
            const child = children.find(c => c.id === studentId);
            if (!child) {
                throw new ForbiddenException('You can only rate teachers on behalf of your own children.');
            }
        } else if (role === 'student') {
            const student = await this.studentsService.findByUserId(userId);
            if (!student) {
                throw new ForbiddenException('Student record not found for this user');
            }
            studentId = student.id;
        } else {
            throw new ForbiddenException('Only students and parents can rate teachers');
        }

        return this.ratingService.create(createDto, studentId);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateDto: UpdateTeacherRatingDto
    ) {
        return this.ratingService.update(id, updateDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        await this.ratingService.remove(id);
    }
}
