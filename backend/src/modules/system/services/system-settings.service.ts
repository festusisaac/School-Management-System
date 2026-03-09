import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
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
            // Optional: delete old file if it exists
            const oldFile = (settings as any)[logoType];
            if (oldFile && oldFile !== filePath) {
                this.removeFileIfExists(oldFile);
            }

            (settings as any)[logoType] = filePath;
            return this.systemSettingRepository.save(settings);
        }
        throw new Error(`Invalid logo type: ${logoType}`);
    }

    async deleteLogo(logoType: string): Promise<SystemSetting> {
        const settings = await this.getSettings();
        if (logoType in settings) {
            const filePath = (settings as any)[logoType];
            if (filePath) {
                this.removeFileIfExists(filePath);
            }

            // Update the database field to null
            const updateData: any = {};
            updateData[logoType] = null;
            await this.systemSettingRepository.update(settings.id, updateData);

            // Return updated settings
            return this.getSettings();
        }
        throw new Error(`Invalid logo type: ${logoType}`);
    }

    private removeFileIfExists(relativeFilePath: string) {
        try {
            // Trim leading slash if present for filesystem operations
            const normalizedPath = relativeFilePath.startsWith('/')
                ? relativeFilePath.substring(1)
                : relativeFilePath;
            const absolutePath = path.join(process.cwd(), normalizedPath);

            if (fs.existsSync(absolutePath)) {
                fs.unlinkSync(absolutePath);
                console.log(`Deleted file: ${absolutePath}`);
            }
        } catch (error) {
            console.error(`Failed to delete file: ${relativeFilePath}`, error);
        }
    }
}
