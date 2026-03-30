import { Controller, Post, Body, UseGuards, Request, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { Permissions } from '../../../decorators/permissions.decorator';
import { BroadcastService } from '../services/broadcast.service';
import { SendBroadcastDto } from '../dto/send-broadcast.dto';

@Controller('communication')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CommunicationController {
  private readonly logger = new Logger(CommunicationController.name);

  constructor(private readonly broadcastService: BroadcastService) {}

  @Post('broadcast')
  @Permissions('communication:manage')
  async broadcast(@Body() dto: SendBroadcastDto, @Request() req: any) {
    this.logger.log(`Broadcast request received: ${dto.target} via ${dto.channel}`);
    return await this.broadcastService.broadcast(dto, req.user.tenantId);
  }
}
