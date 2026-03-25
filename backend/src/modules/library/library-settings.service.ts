import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LibrarySetting } from './entities/library-setting.entity';
import { UpdateLibrarySettingDto } from './dtos/library-setting.dto';

@Injectable()
export class LibrarySettingsService {
  constructor(
    @InjectRepository(LibrarySetting)
    private settingsRepo: Repository<LibrarySetting>,
  ) {}

  async getSettings(tenantId: string): Promise<LibrarySetting | null> {
    const setting = await this.settingsRepo.findOne({ where: { tenantId } });
    return setting || null;
  }

  async upsertSettings(tenantId: string, dto: UpdateLibrarySettingDto): Promise<LibrarySetting> {
    let setting = await this.settingsRepo.findOne({ where: { tenantId } });
    if (!setting) {
      setting = this.settingsRepo.create({ tenantId, graceDays: dto.graceDays ?? 3, finePerDay: dto.finePerDay ?? 50 });
    } else {
      if (dto.graceDays !== undefined) setting.graceDays = dto.graceDays;
      if (dto.finePerDay !== undefined) setting.finePerDay = dto.finePerDay;
    }
    return this.settingsRepo.save(setting);
  }
}
