import { Controller, Post, Body, UseGuards, Request, Logger, Get, Query, Param } from '@nestjs/common';
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

  @Get('logs')
  @Permissions('communication:view')
  async getLogs(@Query() params: any, @Request() req: any) {
    return await this.broadcastService.getLogs(req.user.tenantId, params);
  }

  @Get('logs/student/:studentId')
  @Permissions('communication:view')
  async getLogsByStudent(@Param('studentId') studentId: string, @Request() req: any) {
    return await this.broadcastService.getLogsByStudent(studentId, req.user.tenantId);
  }
}
