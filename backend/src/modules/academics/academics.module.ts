import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from './entities/class.entity';
import { Section } from './entities/section.entity';
import { Subject } from './entities/subject.entity';
import { SubjectGroup } from './entities/subject-group.entity';
import { TimetablePeriod } from './entities/timetable-period.entity';
import { Timetable } from './entities/timetable.entity';
import { SubjectTeacher } from './entities/subject-teacher.entity';
import { ClassSubject } from './entities/class-subject.entity';
import { SchoolSection } from './entities/school-section.entity';

import { AcademicsController } from './controllers/academics.controller';
import { TimetableController } from './controllers/timetable.controller';
import { SubjectTeacherController } from './controllers/subject-teacher.controller';
import { ClassSubjectController } from './controllers/class-subject.controller';
import { SchoolSectionController } from './controllers/school-section.controller';

import { SubjectTeacherService } from './services/subject-teacher.service';
import { AcademicsService } from './services/academics.service';
import { TimetableService } from './services/timetable.service';
import { ClassSubjectService } from './services/class-subject.service';
import { SchoolSectionService } from './services/school-section.service';

import { AuthModule } from '@modules/auth/auth.module';
import { HrModule } from '@modules/hr/hr.module';
import { SystemModule } from '../system/system.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Class, Section, Subject, SubjectGroup, TimetablePeriod, Timetable, SubjectTeacher, ClassSubject, SchoolSection]),
    forwardRef(() => AuthModule), // Import AuthModule to get access to JwtService for JwtAuthGuard
    forwardRef(() => HrModule), // Import HrModule to access Staff entity for class teacher assignment
    forwardRef(() => SystemModule),
  ],
  controllers: [AcademicsController, TimetableController, SubjectTeacherController, ClassSubjectController, SchoolSectionController],
  providers: [AcademicsService, TimetableService, SubjectTeacherService, ClassSubjectService, SchoolSectionService],
  exports: [AcademicsService, TimetableService, ClassSubjectService, SchoolSectionService, SubjectTeacherService, TypeOrmModule],
})
export class AcademicsModule { }
