import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alumni } from './entities/alumni.entity';
import { AlumniEvent } from './entities/alumni-event.entity';
import { AlumniAttendee } from './entities/alumni-attendee.entity';
import { AlumniController } from './controllers/alumni.controller';
import { AlumniService } from './services/alumni.service';
import { StudentsModule } from '../students/students.module';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/entities/user.entity';
import { Student } from '../students/entities/student.entity';
import { CommunicationModule } from '../communication/communication.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alumni, AlumniEvent, AlumniAttendee, User, Student]),
    forwardRef(() => StudentsModule),
    forwardRef(() => AuthModule),
    forwardRef(() => CommunicationModule),
  ],
  controllers: [AlumniController],
  providers: [AlumniService],
  exports: [AlumniService],
})
export class AlumniModule {}
