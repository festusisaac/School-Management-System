import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '../entities/system-setting.entity';
import { UpdateSystemSettingDto } from '../dtos/update-system-setting.dto';

@Injectable()
export class SystemSettingsService {
    constructor(
        @InjectRepository(SystemSetting)
        private readonly systemSettingRepository: Repository<SystemSetting>,
    ) { }

    // Get the global settings (assuming ID '1' or single record)
    async getSettings(): Promise<SystemSetting> {
        const settings = await this.systemSettingRepository.find({
            take: 1,
        });

        if (settings.length > 0) {
            return settings[0];
        }

        // Return a default new object if none exists
        const newSettings = this.systemSettingRepository.create({
            schoolName: 'Your School Name',
            dateFormat: 'DD/MM/YYYY',
            timezone: 'UTC',
            startDayOfWeek: 1,
        });
        return this.systemSettingRepository.save(newSettings);
    }

    async updateSettings(updateDto: UpdateSystemSettingDto): Promise<SystemSetting> {
        const settings = await this.getSettings();

        // Merge changes
        Object.assign(settings, updateDto);

        return this.systemSettingRepository.save(settings);
    }

    // Helper method for updating logos dynamically
    async updateLogo(logoType: string, filePath: string): Promise<SystemSetting> {
        const settings = await this.getSettings();
        if (logoType in settings) {
            (settings as any)[logoType] = filePath;
            return this.systemSettingRepository.save(settings);
        }
        throw new Error(`Invalid logo type: ${logoType}`);
    }
}
