import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { LessonNotesService } from '../services/lesson-notes.service';
import { CreateLessonNoteDto, UpdateLessonNoteDto, LessonNoteFilterDto } from '../dto/lesson-note.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { Permissions } from '../../../decorators/permissions.decorator';
import { CurrentUser } from '../../../decorators/current-user.decorator';
import { User } from '../../auth/entities/user.entity';

@Controller('lesson-notes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LessonNotesController {
    constructor(private readonly lessonNotesService: LessonNotesService) {}

    @Post()
    @Permissions('lesson_notes:manage')
    create(
        @Body() createDto: CreateLessonNoteDto,
        @CurrentUser() user: User,
    ) {
        return this.lessonNotesService.create(createDto, user, user.tenantId);
    }

    @Get()
    @Permissions('lesson_notes:view')
    findAll(
        @Query() filterDto: LessonNoteFilterDto,
        @CurrentUser() user: User,
    ) {
        return this.lessonNotesService.findAll(filterDto, user, user.tenantId);
    }

    @Get(':id')
    @Permissions('lesson_notes:view')
    findOne(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ) {
        return this.lessonNotesService.findOne(id, user.tenantId);
    }

    @Patch(':id')
    @Permissions('lesson_notes:manage')
    update(
        @Param('id') id: string,
        @Body() updateDto: UpdateLessonNoteDto,
        @CurrentUser() user: User,
    ) {
        return this.lessonNotesService.update(id, updateDto, user, user.tenantId);
    }

    @Delete(':id')
    @Permissions('lesson_notes:manage')
    remove(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ) {
        return this.lessonNotesService.delete(id, user, user.tenantId);
    }

    @Post(':id/submit')
    @Permissions('lesson_notes:manage')
    submit(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ) {
        return this.lessonNotesService.submit(id, user, user.tenantId);
    }

    @Post(':id/review')
    @Permissions('lesson_notes:approve')
    review(
        @Param('id') id: string,
        @Body('status') status: 'approved' | 'rejected',
        @Body('reviewNotes') reviewNotes: string,
        @CurrentUser() user: User,
    ) {
        return this.lessonNotesService.review(id, status, reviewNotes, user, user.tenantId);
    }

    @Post(':id/clone')
    @Permissions('lesson_notes:manage')
    clone(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ) {
        return this.lessonNotesService.clone(id, user, user.tenantId);
    }
}
