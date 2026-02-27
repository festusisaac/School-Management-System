import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = process.env.BACKUP_DIR || '/backups';
  private readonly dbUser = process.env.DATABASE_USER;
  private readonly dbHost = process.env.DATABASE_HOST || 'localhost';
  private readonly dbName = process.env.DATABASE_NAME;
  private readonly dbPassword = process.env.DATABASE_PASSWORD;

  constructor() {
    this.ensureBackupDir();
  }

  private ensureBackupDir(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      this.logger.log(`Created backup directory: ${this.backupDir}`);
    }
  }

  async createFullBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `sms-backup-${timestamp}.sql.gz`;
      const backupPath = path.join(this.backupDir, backupFileName);

      this.logger.log(`Starting full database backup: ${backupFileName}`);

      const env = {
        ...process.env,
        PGPASSWORD: this.dbPassword,
      };

      const command = `pg_dump -U ${this.dbUser} -h ${this.dbHost} ${this.dbName} | gzip > ${backupPath}`;

      await execAsync(command, { env });

      const stats = fs.statSync(backupPath);
      this.logger.log(
        `✅ Backup completed successfully: ${backupFileName} (${this.formatBytes(stats.size)})`,
      );

      return backupPath;
    } catch (error: any) {
      this.logger.error(`❌ Backup failed: ${error?.message ?? String(error)}`);
      throw error;
    }
  }

  async createSchemaBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `sms-schema-${timestamp}.sql.gz`;
      const backupPath = path.join(this.backupDir, backupFileName);

      this.logger.log(`Starting schema backup: ${backupFileName}`);

      const env = {
        ...process.env,
        PGPASSWORD: this.dbPassword,
      };

      const command = `pg_dump -U ${this.dbUser} -h ${this.dbHost} --schema-only ${this.dbName} | gzip > ${backupPath}`;

      await execAsync(command, { env });

      const stats = fs.statSync(backupPath);
      this.logger.log(
        `✅ Schema backup completed: ${backupFileName} (${this.formatBytes(stats.size)})`,
      );

      return backupPath;
    } catch (error: any) {
      this.logger.error(`❌ Schema backup failed: ${error?.message ?? String(error)}`);
      throw error;
    }
  }

  async listBackups(): Promise<Array<{ name: string; size: number; date: Date }>> {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return [];
      }

      const files = fs.readdirSync(this.backupDir);
      const backups = files
        .filter(
          (file) =>
            file.startsWith('sms-backup-') && file.endsWith('.sql.gz'),
        )
        .map((file) => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: stats.size,
            date: stats.mtime,
          };
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      return backups;
    } catch (error: any) {
      this.logger.error(`Failed to list backups: ${error?.message ?? String(error)}`);
      throw error;
    }
  }

  async deleteOldBackups(retentionDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      if (!fs.existsSync(this.backupDir)) {
        return 0;
      }

      const files = fs.readdirSync(this.backupDir);
      let deletedCount = 0;

      for (const file of files) {
        if (file.startsWith('sms-backup-') && file.endsWith('.sql.gz')) {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);

          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
            deletedCount++;
            this.logger.log(`Deleted old backup: ${file}`);
          }
        }
      }

      this.logger.log(
        `Cleaned up ${deletedCount} backups older than ${retentionDays} days`,
      );
      return deletedCount;
    } catch (error: any) {
      this.logger.error(`Failed to delete old backups: ${error?.message ?? String(error)}`);
      throw error;
    }
  }

  async verifyBackupIntegrity(backupPath: string): Promise<boolean> {
    try {
      const command = `gzip -t ${backupPath}`;
      await execAsync(command);
      this.logger.log(`✅ Backup integrity verified: ${path.basename(backupPath)}`);
      return true;
    } catch (error) {
      this.logger.error(
        `❌ Backup integrity check failed: ${path.basename(backupPath)}`,
      );
      return false;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
