import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamSetupService } from './services/exam-setup.service';
import { ScoreEntryService } from './services/score-entry.service';
import { ResultProcessingService } from './services/result-processing.service';
import { ResultControlService } from './services/result-control.service';
import { ExamSetupController } from './controllers/exam-setup.controller';
import { ScoreEntryController } from './controllers/score-entry.controller';
import { ResultProcessingController } from './controllers/result-processing.controller';
import { ResultControlController } from './controllers/result-control.controller';
import { ExamGroup } from './entities/exam-group.entity';
import { AssessmentType } from './entities/assessment-type.entity';
import { GradeScale } from './entities/grade-scale.entity';
import { RemarkConfig } from './entities/remark-config.entity';
import { Exam } from './entities/exam.entity';
import { ExamSchedule } from './entities/exam-schedule.entity';
import { AdmitCard } from './entities/admit-card.entity';
import { PsychomotorDomain } from './entities/psychomotor-domain.entity';
import { AffectiveDomain } from './entities/affective-domain.entity';
import { ExamResult } from './entities/exam-result.entity';
import { StudentTermResult } from './entities/student-term-result.entity';
import { StudentPsychomotor } from './entities/student-psychomotor.entity';
import { StudentSkill } from './entities/student-skill.entity';
import { ScratchCard } from './entities/scratch-card.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ExamGroup,
            AssessmentType,
            GradeScale,
            RemarkConfig,
            Exam,
            ExamSchedule,
            AdmitCard,
            PsychomotorDomain,
            AffectiveDomain,
            ExamResult,
            StudentTermResult,
            StudentPsychomotor,
            StudentSkill,
            ScratchCard,
        ]),
    ],
    controllers: [
        ExamSetupController,
        ScoreEntryController,
        ResultProcessingController,
        ResultControlController
    ],
    providers: [
        ExamSetupService,
        ScoreEntryService,
        ResultProcessingService,
        ResultControlService
    ],
    exports: [
        ExamSetupService,
        ScoreEntryService,
        ResultProcessingService,
        ResultControlService
    ],
})
export class ExaminationModule { }
