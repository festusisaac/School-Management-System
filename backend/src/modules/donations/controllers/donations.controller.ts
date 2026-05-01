import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Request, Query, ForbiddenException, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { DonationsService } from '../services/donations.service';
import { CreateDonationProjectDto, UpdateDonationProjectDto, InitiateDonationDto, VerifyDonationDto } from '../dtos/donations.dto';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { PermissionsGuard } from '@guards/permissions.guard';
import { Permissions } from '@decorators/permissions.decorator';
import { Public } from '@decorators/public.decorator';
import { EntityManager } from 'typeorm';

@Controller('donations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DonationsController {
  constructor(
    private readonly donationsService: DonationsService,
    private readonly entityManager: EntityManager
  ) {}

  private async resolvePublicTenantId(providedId?: string): Promise<string> {
    if (providedId) return providedId;

    // Resolve tenantId: Prioritize a tenant that actually has classes first (most likely a real school)
    let result = await this.entityManager.query('SELECT "tenantId" FROM "classes" ORDER BY "tenantId" ASC LIMIT 1');
    let tenantId = result[0]?.tenantId;

    // Fallback to first Super Admin's tenant
    if (!tenantId) {
      result = await this.entityManager.query('SELECT "tenantId" FROM "users" WHERE "role" ILIKE \'%Super Administrator%\' ORDER BY "tenantId" ASC LIMIT 1');
      tenantId = result[0]?.tenantId;
    }

    if (!tenantId) throw new ForbiddenException('Tenant context missing');
    return tenantId;
  }

  // --- Public Endpoints ---

  @Public()
  @Get('projects/public')
  async findAllPublic(@Request() req: any) {
    const tenantId = await this.resolvePublicTenantId(req.headers['x-tenant-id'] || req.query.tenantId);
    return this.donationsService.findAllProjects(tenantId, true);
  }

  @Public()
  @Get('projects/:id/public')
  async findOnePublic(@Param('id') id: string, @Query('tenantId') tenantIdQuery: string) {
    const tenantId = await this.resolvePublicTenantId(tenantIdQuery);
    return this.donationsService.findOneProject(id, tenantId);
  }

  @Public()
  @Post('initiate')
  async initiate(@Body() dto: InitiateDonationDto, @Request() req: any) {
    console.log('Initiating donation for tenant:', req.headers['x-tenant-id'] || dto.tenantId);
    const tenantId = await this.resolvePublicTenantId(req.headers['x-tenant-id'] || dto.tenantId);
    console.log('Resolved tenantId:', tenantId);
    try {
      return await this.donationsService.initiateDonation(dto, tenantId);
    } catch (error) {
      console.error('Donation initiation error:', error);
      throw error;
    }
  }

  @Public()
  @Post('verify')
  async verify(@Body() dto: VerifyDonationDto, @Request() req: any) {
    const tenantId = await this.resolvePublicTenantId(req.headers['x-tenant-id'] || dto.tenantId);
    return this.donationsService.verifyDonation(dto, tenantId);
  }

  @Public()
  @Get('stats/public')
  async getPublicStats(@Query('tenantId') tenantIdQuery: string) {
    const tenantId = await this.resolvePublicTenantId(tenantIdQuery);
    return this.donationsService.getImpactStats(tenantId);
  }

  // --- Admin Endpoints ---
  @Post('projects')
  @Permissions('donations:manage_projects')
  @UseInterceptors(FileInterceptor('bannerImage', {
    storage: diskStorage({
      destination: './uploads/donations',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        cb(null, `project-${uniqueSuffix}${ext}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
        return cb(new BadRequestException('Only images are allowed!'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
  }))
  create(@Body() dto: CreateDonationProjectDto, @Request() req: any, @UploadedFile() file?: Express.Multer.File) {
    if (file) {
      dto.bannerImage = `uploads/donations/${file.filename}`;
    }
    return this.donationsService.createProject(dto, req.user.tenantId);
  }

  @Get('projects')
  @Permissions('donations:manage_projects')
  findAll(@Request() req: any) {
    return this.donationsService.findAllProjects(req.user.tenantId);
  }

  @Put('projects/:id')
  @Permissions('donations:manage_projects')
  @UseInterceptors(FileInterceptor('bannerImage', {
    storage: diskStorage({
      destination: './uploads/donations',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        cb(null, `project-${uniqueSuffix}${ext}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
        return cb(new BadRequestException('Only images are allowed!'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
  }))
  update(@Param('id') id: string, @Body() dto: UpdateDonationProjectDto, @Request() req: any, @UploadedFile() file?: Express.Multer.File) {
    if (file) {
      dto.bannerImage = `uploads/donations/${file.filename}`;
    }
    return this.donationsService.updateProject(id, dto, req.user.tenantId);
  }

  @Delete('projects/:id')
  @Permissions('donations:manage_projects')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.donationsService.removeProject(id, req.user.tenantId);
  }

  @Get('history')
  @Permissions('donations:view')
  getHistory(@Request() req: any) {
    return this.donationsService.getDonationHistory(req.user.tenantId);
  }

  @Get('stats')
  @Permissions('donations:view')
  getStats(@Request() req: any) {
    return this.donationsService.getImpactStats(req.user.tenantId);
  }
}
