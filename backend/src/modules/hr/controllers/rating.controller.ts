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
} from '@nestjs/common';
import { RatingService } from '../services/rating.service';
import { CreateTeacherRatingDto, UpdateTeacherRatingDto } from '../dto/teacher-rating.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { CurrentUser } from '../../../decorators/current-user.decorator';
import { StudentsService } from '../../students/services/students.service';
import { ForbiddenException } from '@nestjs/common';

@Controller('hr/ratings')
@UseGuards(JwtAuthGuard)
export class RatingController {
    constructor(
        private readonly ratingService: RatingService,
        private readonly studentsService: StudentsService,
    ) { }

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
        @Body() createDto: CreateTeacherRatingDto,
        @CurrentUser('id') userId: string,
        @CurrentUser('role') role: string
    ) {
        if (role !== 'student') {
            throw new ForbiddenException('Only students can rate teachers');
        }

        const student = await this.studentsService.findByUserId(userId);
        if (!student) {
            throw new ForbiddenException('Student record not found for this user');
        }

        return this.ratingService.create(createDto, student.id);
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
