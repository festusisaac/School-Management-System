import { Test, TestingModule } from '@nestjs/testing';
import { BackupService } from '../backup.service';
import * as fs from 'fs';

jest.mock('fs');
jest.mock('child_process', () => ({
  exec: jest.fn((cmd, opts, callback) => {
    // If no callback is passed (because of promisify), it's handled differently,
    // but promisify expects a callback signature (err, stdout, stderr)
    if (typeof opts === 'function') {
      opts(null, { stdout: 'ok', stderr: '' });
    } else if (typeof callback === 'function') {
      callback(null, { stdout: 'ok', stderr: '' });
    }
  }),
}));

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('BackupService', () => {
  let service: BackupService;

  beforeEach(async () => {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.statSync.mockReturnValue({ size: 1024, mtime: new Date() } as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [BackupService],
    }).compile();

    service = module.get<BackupService>(BackupService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFullBackup', () => {
    it('should execute pg_dump', async () => {
      const res = await service.createFullBackup();
      expect(res).toContain('sms-backup-');
    });
  });

  describe('createSchemaBackup', () => {
    it('should execute pg_dump schema only', async () => {
      const res = await service.createSchemaBackup();
      expect(res).toContain('sms-schema-');
    });
  });

  describe('listBackups', () => {
    it('should return list of backups', async () => {
      mockedFs.readdirSync.mockReturnValueOnce(['sms-backup-1.sql.gz', 'sms-backup-2.sql.gz'] as any);
      const res = await service.listBackups();
      expect(res).toHaveLength(2);
    });
  });

  describe('deleteOldBackups', () => {
    it('should unlink old backups', async () => {
      mockedFs.readdirSync.mockReturnValueOnce(['sms-backup-1.sql.gz'] as any);
      // Make mtime very old
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40);
      mockedFs.statSync.mockReturnValueOnce({ size: 1024, mtime: oldDate } as any);
      mockedFs.unlinkSync.mockReturnValueOnce(undefined);

      const res = await service.deleteOldBackups(30);
      expect(res).toBe(1);
      expect(mockedFs.unlinkSync).toHaveBeenCalled();
    });
  });

  describe('verifyBackupIntegrity', () => {
    it('should run gzip -t', async () => {
      const res = await service.verifyBackupIntegrity('path');
      expect(res).toBe(true);
    });
  });
});
