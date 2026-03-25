import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { LibrarySettingsService } from './library-settings.service';
import { UpdateLibrarySettingDto } from './dtos/library-setting.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Library Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('library/settings')
export class LibrarySettingsController {
  constructor(private readonly settingsService: LibrarySettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get library settings for tenant' })
  getSettings(@Request() req: any) {
    return this.settingsService.getSettings(req.user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create or update library settings for tenant' })
  upsertSettings(@Request() req: any, @Body() dto: UpdateLibrarySettingDto) {
    return this.settingsService.upsertSettings(req.user.tenantId, dto);
  }
}
