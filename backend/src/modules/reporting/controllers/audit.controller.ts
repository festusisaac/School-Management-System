import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { Permissions } from '../../../decorators/permissions.decorator';
import { AuditService } from '../services/audit.service';

@Controller('reporting/audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('overview')
  @Permissions('audit_reports:view')
  async getOverview(@Req() req: any) {
    return this.auditService.getOverview(req.user.tenantId);
  }

  @Get('activity-logs')
  @Permissions('audit_reports:view')
  async getActivityLogs(@Query() query: any, @Req() req: any) {
    return this.auditService.getActivityLogs(req.user.tenantId, query);
  }

  @Get('communication-logs')
  @Permissions('audit_reports:view')
  async getCommunicationLogs(@Query() query: any, @Req() req: any) {
    return this.auditService.getCommunicationLogs(req.user.tenantId, query);
  }
}
