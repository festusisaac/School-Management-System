import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonNotesController } from './controllers/lesson-notes.controller';
import { LessonNotesService } from './services/lesson-notes.service';
import { LessonNote } from './entities/lesson-note.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([LessonNote]),
    ],
    controllers: [LessonNotesController],
    providers: [LessonNotesService],
    exports: [LessonNotesService],
})
export class LessonNotesModule {}
