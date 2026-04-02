import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemModule } from '../system/system.module';
import { MessageTemplate } from './entities/message-template.entity';
import { CommunicationLog } from './entities/communication-log.entity';
import { MessageTemplatesService } from './services/message-templates.service';
import { MessageTemplatesController } from './controllers/message-templates.controller';
import { CommunicationController } from './controllers/communication.controller';
import { BroadcastService } from './services/broadcast.service';
import { Student } from '../students/entities/student.entity';
import { Staff } from '../hr/entities/staff.entity';
import { StudentsModule } from '../students/students.module';
import { HrModule } from '../hr/hr.module';
import { InternalCommunicationModule } from '../internal-communication/internal-communication.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageTemplate, CommunicationLog, Student, Staff]),
    InternalCommunicationModule,
    forwardRef(() => SystemModule),
    forwardRef(() => StudentsModule),
    forwardRef(() => HrModule),
    forwardRef(() => FinanceModule),
  ],
  controllers: [MessageTemplatesController, CommunicationController],
  providers: [
    MessageTemplatesService,
    BroadcastService,
  ],
  exports: [MessageTemplatesService, BroadcastService, InternalCommunicationModule],
})
export class CommunicationModule { }
