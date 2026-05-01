import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { PermissionsGuard } from '@guards/permissions.guard';
import { Permissions } from '@decorators/permissions.decorator';
import { Public } from '@decorators/public.decorator';
import { CareerService } from '../services/career.service';
import { CreateJobPostingDto, UpdateJobPostingDto } from '../dtos/job-posting.dto';

@Controller('career')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CareerController {
  constructor(private readonly careerService: CareerService) {}

  @Post('jobs')
  @Permissions('career:manage')
  create(@Body() dto: CreateJobPostingDto, @Request() req: any) {
    if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
    return this.careerService.create(dto, req.user.tenantId);
  }

  @Get('jobs')
  @Permissions('career:view')
  findAll(@Request() req: any) {
    if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
    return this.careerService.findAll(req.user.tenantId);
  }

  @Public()
  @Get('jobs/public')
  findAllPublic(@Request() req: any) {
    return this.careerService.findPublic(req.user?.tenantId);
  }

  @Get('jobs/:id')
  @Permissions('career:view')
  findOne(@Param('id') id: string, @Request() req: any) {
    if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
    return this.careerService.findOne(id, req.user.tenantId);
  }

  @Patch('jobs/:id')
  @Permissions('career:manage')
  update(@Param('id') id: string, @Body() dto: UpdateJobPostingDto, @Request() req: any) {
    if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
    return this.careerService.update(id, dto, req.user.tenantId);
  }

  @Delete('jobs/:id')
  @Permissions('career:manage')
  remove(@Param('id') id: string, @Request() req: any) {
    if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
    return this.careerService.remove(id, req.user.tenantId);
  }
}
