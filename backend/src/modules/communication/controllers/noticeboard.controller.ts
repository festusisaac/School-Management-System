import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    Query,
  } from '@nestjs/common';
  import { NoticeboardService } from '../services/noticeboard.service';
  import { CreateNoticeDto, UpdateNoticeDto } from '../dto/notice.dto';
  import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
  import { PermissionsGuard } from '../../../guards/permissions.guard';
  import { Permissions } from '../../../decorators/permissions.decorator';
  import { NoticeAudience } from '../entities/notice.entity';
  
  @Controller('communication/notices')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  export class NoticeboardController {
    constructor(private readonly noticeboardService: NoticeboardService) {}
  
    @Post()
    @Permissions('communication:manage_notices')
    async create(@Body() createDto: CreateNoticeDto, @Request() req: any) {
      // We pass the email to help the service find the correct Staff record ID
      return await this.noticeboardService.create(createDto, req.user.id, req.user.tenantId, req.user.email);
    }
  
    @Get()
    @Permissions('communication:view_notices')
    async findAll(
      @Query('audience') audience: NoticeAudience,
      @Query('schoolSectionId') schoolSectionId?: string,
      @Request() req?: any
    ) {
      return await this.noticeboardService.findAll(req.user.tenantId, audience, schoolSectionId);
    }
  
    @Get('admin')
    @Permissions('communication:manage_notices')
    async findAllForAdmin(
      @Query('schoolSectionId') schoolSectionId?: string,
      @Request() req?: any
    ) {
      return await this.noticeboardService.findAllForAdmin(req.user.tenantId, schoolSectionId);
    }
  
    @Get(':id')
    @Permissions('communication:view_notices')
    async findOne(@Param('id') id: string, @Request() req: any) {
      return await this.noticeboardService.findOne(id, req.user.tenantId);
    }
  
    @Patch(':id')
    @Permissions('communication:manage_notices')
    async update(
      @Param('id') id: string,
      @Body() updateDto: UpdateNoticeDto,
      @Request() req: any,
    ) {
      return await this.noticeboardService.update(id, updateDto, req.user.tenantId);
    }
  
    @Delete(':id')
    @Permissions('communication:manage_notices')
    async remove(@Param('id') id: string, @Request() req: any) {
      return await this.noticeboardService.remove(id, req.user.tenantId);
    }
  }
