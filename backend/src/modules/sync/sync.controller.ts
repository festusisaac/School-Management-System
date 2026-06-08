import { Controller, Get, Post, Query, Body, UseGuards, Req } from '@nestjs/common';
import { SyncService } from './sync.service';
import { JwtAuthGuard, RolesGuard } from '../../guards/jwt-auth.guard';
import { Roles } from '../../decorators/roles.decorator';

@Controller('sync')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super admin', 'admin', 'principal', 'teacher', 'accountant')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('pull')
  async pullChanges(
    @Query('lastPulledAt') lastPulledAt: string,
    @Req() req: any,
  ) {
    const timestamp = lastPulledAt && lastPulledAt !== '0' && lastPulledAt !== 'null'
      ? new Date(parseInt(lastPulledAt))
      : new Date(0);
    return this.syncService.getPullChanges(timestamp, req.user.tenantId);
  }

  @Get('pull-all')
  async pullAllChanges(@Req() req: any) {
    return this.syncService.getPullAllChanges(req.user.tenantId);
  }

  @Post('push')
  async pushChanges(
    @Body() body: { changes: any; lastPulledAt: number },
    @Req() req: any,
  ) {
    await this.syncService.pushChanges(body.changes, req.user.tenantId);
    return { success: true };
  }
}
