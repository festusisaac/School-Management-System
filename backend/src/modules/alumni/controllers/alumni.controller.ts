import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { PermissionsGuard } from '@guards/permissions.guard';
import { Permissions } from '@decorators/permissions.decorator';
import { AlumniService } from '../services/alumni.service';
import { Public } from '@decorators/public.decorator';
import { CreateAlumniDto, UpdateAlumniDto, GraduateStudentDto, BulkGraduateStudentsDto, CreateAlumniEventDto, UpdateAlumniEventDto } from '../dtos/alumni.dto';

@Controller('alumni')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AlumniController {
  constructor(private readonly alumniService: AlumniService) {}

  @Post()
  @Permissions('alumni:create')
  create(@Body() dto: CreateAlumniDto, @Request() req: any) {
    if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
    return this.alumniService.create(dto, req.user.tenantId);
  }

  @Post('graduate')
  @Permissions('alumni:create')
  graduate(@Body() dto: GraduateStudentDto, @Request() req: any) {
    if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
    return this.alumniService.graduateStudent(dto, req.user.tenantId);
  }

  @Post('bulk-graduate')
  @Permissions('alumni:create')
  bulkGraduate(@Body() dto: BulkGraduateStudentsDto, @Request() req: any) {
    if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
    return this.alumniService.bulkGraduate(dto, req.user.tenantId);
  }

  @Get()
  @Permissions('alumni:view')
  findAll(@Request() req: any) {
    if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
    return this.alumniService.findAll(req.user.tenantId);
  }

  @Get(':id')
  @Permissions('alumni:view')
  findOne(@Param('id') id: string, @Request() req: any) {
    if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
    return this.alumniService.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  @Permissions('alumni:edit')
  update(@Param('id') id: string, @Body() dto: UpdateAlumniDto, @Request() req: any) {
    if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
    return this.alumniService.update(id, dto, req.user.tenantId);
  }

  @Delete(':id')
  @Permissions('alumni:delete')
  remove(@Param('id') id: string, @Request() req: any) {
    if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
    return this.alumniService.remove(id, req.user.tenantId);
  }

  @Public()
  @Get('featured/public')
  getFeatured(@Request() req: any) {
    return this.alumniService.getFeaturedAlumni(req.user?.tenantId);
  }

  @Patch(':id/toggle-featured')
  @Permissions('alumni:edit')
  toggleFeatured(@Param('id') id: string, @Request() req: any) {
    if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
    return this.alumniService.toggleFeatured(id, req.user.tenantId);
  }

  // --- Events ---

  @Get(':id/attendance')
  async getAttendance(@Param('id') id: string) {
    return this.alumniService.getAlumniAttendance(id);
  }

  @Post('events')
  @Permissions('alumni:manage_events')
  createEvent(@Body() dto: CreateAlumniEventDto, @Request() req: any) {
    if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
    return this.alumniService.createEvent(dto, req.user.tenantId);
  }

  @Get('events/all')
  @Permissions('alumni:view')
  findAllEvents(@Request() req: any) {
    if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
    return this.alumniService.findAllEvents(req.user.tenantId);
  }

  @Get('events/:id')
  @Permissions('alumni:view')
  findOneEvent(@Param('id') id: string, @Request() req: any) {
    if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
    return this.alumniService.findOneEvent(id, req.user.tenantId);
  }

  @Patch('events/:id')
  @Permissions('alumni:manage_events')
  updateEvent(@Param('id') id: string, @Body() dto: UpdateAlumniEventDto, @Request() req: any) {
    if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
    return this.alumniService.updateEvent(id, dto, req.user.tenantId);
  }

  @Delete('events/:id')
  @Permissions('alumni:manage_events')
  removeEvent(@Param('id') id: string, @Request() req: any) {
    if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
    return this.alumniService.removeEvent(id, req.user.tenantId);
  }

  // --- Attendees ---

  @Post('events/:eventId/attendees/:alumniId')
  @Permissions('alumni:manage_events')
  registerAttendee(
    @Param('eventId') eventId: string,
    @Param('alumniId') alumniId: string,
    @Request() req: any
  ) {
    if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
    return this.alumniService.registerAttendee(eventId, alumniId, req.user.tenantId);
  }

  @Get('events/:eventId/attendees')
  @Permissions('alumni:view')
  getEventAttendees(@Param('eventId') eventId: string, @Request() req: any) {
    if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
    return this.alumniService.getEventAttendees(eventId, req.user.tenantId);
  }

  @Delete('events/attendees/:attendeeId')
  @Permissions('alumni:manage_events')
  removeAttendee(@Param('attendeeId') attendeeId: string, @Request() req: any) {
    if (!req.user?.tenantId) throw new ForbiddenException('Tenant context missing');
    return this.alumniService.removeAttendee(attendeeId, req.user.tenantId);
  }
}
