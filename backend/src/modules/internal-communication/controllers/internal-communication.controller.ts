import { Controller, Post, Body, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunicationLog, CommunicationStatus } from '../../communication/entities/communication-log.entity';

@Controller('internal-communication')
export class InternalCommunicationController {
  private readonly logger = new Logger(InternalCommunicationController.name);

  constructor(
    @InjectRepository(CommunicationLog)
    private readonly logRepository: Repository<CommunicationLog>,
  ) {}

  @Post('webhooks/resend')
  @HttpCode(HttpStatus.OK)
  async handleResendWebhook(@Body() payload: any) {
    const { type, data } = payload;
    const emailId = data?.email_id || data?.id;

    if (!emailId) {
      return { received: true };
    }

    this.logger.log(`Received Resend Webhook: ${type} for Email ID: ${emailId}`);

    const log = await this.logRepository.findOne({ where: { providerMessageId: emailId } });
    if (!log) {
      this.logger.warn(`No communication log found for providerMessageId: ${emailId}`);
      return { received: true };
    }

    // Map Resend events to our CommunicationStatus
    switch (type) {
      case 'email.sent':
        log.status = CommunicationStatus.SENT;
        break;
      case 'email.delivered':
        log.status = CommunicationStatus.DELIVERED;
        log.deliveredAt = new Date();
        break;
      case 'email.opened':
        log.status = CommunicationStatus.OPENED;
        if (!log.openedAt) log.openedAt = new Date();
        break;
      case 'email.bounced':
        log.status = CommunicationStatus.BOUNCED;
        break;
      case 'email.complained':
        log.status = CommunicationStatus.BOUNCED; // Treat complaints as bounced/invalid
        break;
      case 'email.delivery_delayed':
        // Keep as SENT or PENDING
        break;
    }

    await this.logRepository.save(log);
    return { success: true };
  }
}
