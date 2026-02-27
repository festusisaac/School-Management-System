import { Controller, Post, Get, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { BackupService } from './backup.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Backups')
@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('full')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create full database backup' })
  @ApiResponse({ status: 200, description: 'Backup created successfully' })
  async createFullBackup() {
    const backupPath = await this.backupService.createFullBackup();
    return {
      message: 'Full backup created successfully',
      backupPath,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('schema')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create schema-only backup' })
  @ApiResponse({ status: 200, description: 'Schema backup created successfully' })
  async createSchemaBackup() {
    const backupPath = await this.backupService.createSchemaBackup();
    return {
      message: 'Schema backup created successfully',
      backupPath,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('list')
  @ApiOperation({ summary: 'List all available backups' })
  @ApiResponse({ status: 200, description: 'List of backups' })
  async listBackups() {
    const backups = await this.backupService.listBackups();
    return {
      count: backups.length,
      backups,
    };
  }

  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete backups older than retention days' })
  @ApiResponse({ status: 200, description: 'Old backups deleted' })
  async cleanupOldBackups() {
    const deletedCount = await this.backupService.deleteOldBackups(
      parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
    );
    return {
      message: `${deletedCount} old backups deleted`,
      deletedCount,
    };
  }

  @Post('verify/:filename')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify backup integrity' })
  @ApiResponse({ status: 200, description: 'Backup integrity verified' })
  async verifyBackup(@Param('filename') filename: string) {
    const backupPath = `${process.env.BACKUP_DIR || '/backups'}/${filename}`;
    const isValid = await this.backupService.verifyBackupIntegrity(backupPath);
    return {
      filename,
      isValid,
      message: isValid ? 'Backup is valid' : 'Backup is corrupted',
    };
  }
}
