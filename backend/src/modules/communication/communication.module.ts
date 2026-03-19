import { forwardRef, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { SystemModule } from '../system/system.module';

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
  providers: [EmailService, SmsService],
  exports: [EmailService, SmsService],
})
export class CommunicationModule { }
