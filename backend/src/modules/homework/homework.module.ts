import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Homework } from './entities/homework.entity';
import { HomeworkSubmission } from './entities/submission.entity';
import { HomeworkService } from './services/homework.service';
import { HomeworkSubmissionService } from './services/homework-submission.service';
import { HomeworkController } from './controllers/homework.controller';
import { Student } from '../students/entities/student.entity';
import { CommunicationModule } from '../communication/communication.module';
import { SystemModule } from '../system/system.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Homework, HomeworkSubmission, Student]),
        CommunicationModule,
        SystemModule,
    ],
    controllers: [HomeworkController],
    providers: [HomeworkService, HomeworkSubmissionService],
    exports: [HomeworkService, HomeworkSubmissionService],
})
export class HomeworkModule {}

