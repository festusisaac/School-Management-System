import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailService } from '@modules/internal-communication/email.service';
import { SmsService } from '@modules/internal-communication/sms.service';
import { EmailProcessor } from '@modules/internal-communication/processors/email.processor';
import { SmsProcessor } from '@modules/internal-communication/processors/sms.processor';
import { SystemModule } from '../system/system.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunicationLog } from '../communication/entities/communication-log.entity';
import { InternalCommunicationController } from './controllers/internal-communication.controller';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'sms' },
      { name: 'notifications' }
    ),
    forwardRef(() => SystemModule),
    TypeOrmModule.forFeature([CommunicationLog]),
  ],
  controllers: [
    InternalCommunicationController
  ],
  providers: [
    EmailService, 
    SmsService, 
    EmailProcessor, 
    SmsProcessor
  ],
  exports: [
    EmailService, 
    SmsService,
    BullModule
  ],
})
export class InternalCommunicationModule {}
