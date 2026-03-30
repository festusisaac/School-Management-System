import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailService } from '@modules/internal-communication/email.service';
import { SmsService } from '@modules/internal-communication/sms.service';
import { EmailProcessor } from '@modules/internal-communication/processors/email.processor';
import { SmsProcessor } from '@modules/internal-communication/processors/sms.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'sms' },
      { name: 'notifications' }
    ),
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
