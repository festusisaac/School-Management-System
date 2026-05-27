import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('pull')
  async pullChanges(
    @Query('lastPulledAt') lastPulledAt: string,
    @Query('tenantId') tenantId: string,
  ) {
    const timestamp = lastPulledAt && lastPulledAt !== 'null' ? new Date(parseInt(lastPulledAt)) : new Date(0);
    return this.syncService.getPullChanges(timestamp, tenantId);
  }

  @Post('push')
  async pushChanges(
    @Body() changes: any,
    @Query('tenantId') tenantId: string,
  ) {
    await this.syncService.pushChanges(changes, tenantId);
    return { success: true };
  }
}
