import { forwardRef, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { SystemModule } from '../system/system.module';
import { EmailProcessor } from './processors/email.processor';

@Module({
  imports: [
    forwardRef(() => SystemModule),
    BullModule.registerQueue({
      name: 'email',
    }),
    BullModule.registerQueue({
      name: 'sms',
    }),
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  controllers: [],
  providers: [EmailService, SmsService, EmailProcessor],
  exports: [EmailService, SmsService],
})
export class CommunicationModule { }
