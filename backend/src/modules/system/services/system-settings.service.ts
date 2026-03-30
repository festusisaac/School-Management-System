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
            isInitialized: false,
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

        // Allowed logo types
        const allowedTypes = ['primaryLogo', 'favicon', 'printLogo', 'invoiceLogo', 'documentLogo'];
        if (!allowedTypes.includes(logoType)) {
            throw new Error(`Invalid logo type: ${logoType}`);
        }

        // Cleanup old file if it exists
        const oldFile = (settings as any)[logoType];
        if (oldFile && oldFile !== filePath) {
            this.removeFileIfExists(oldFile);
        }

        // Update settings
        (settings as any)[logoType] = filePath;
        return this.systemSettingRepository.save(settings);
    }

    async deleteLogo(logoType: string): Promise<SystemSetting> {
        const settings = await this.getSettings();

        const allowedTypes = ['primaryLogo', 'favicon', 'printLogo', 'invoiceLogo', 'documentLogo'];
        if (!allowedTypes.includes(logoType)) {
            throw new Error(`Invalid logo type: ${logoType}`);
        }

        const filePath = (settings as any)[logoType];
        if (filePath) {
            console.log(`SystemSettingsService: Attempting to delete logo type "${logoType}" at: ${filePath}`);
            this.removeFileIfExists(filePath);
        }

        // Clear the field and save
        (settings as any)[logoType] = null;
        return this.systemSettingRepository.save(settings);
    }

    private removeFileIfExists(relativeFilePath: string) {
        try {
            if (!relativeFilePath) return;

            // Trim leading slash for filesystem operations
            const normalizedPath = relativeFilePath.startsWith('/')
                ? relativeFilePath.substring(1)
                : relativeFilePath;

            // Use absolute resolution
            const absolutePath = path.resolve(process.cwd(), normalizedPath);
            console.log(`SystemSettingsService: process.cwd() = ${process.cwd()}`);
            console.log(`SystemSettingsService: Resolved path = ${absolutePath}`);

            if (fs.existsSync(absolutePath)) {
                fs.unlinkSync(absolutePath);
                console.log(`SystemSettingsService: SUCCESS. Deleted file.`);
            } else {
                console.warn(`SystemSettingsService: FILE NOT FOUND at ${absolutePath}`);
            }
        } catch (error) {
            console.error(`SystemSettingsService: ERROR deleting ${relativeFilePath}:`, error);
        }
    }

    /**
     * Returns the currently active academic session ID.
     * Used by all modules to scope data to the active session.
     */
    async getActiveSessionId(): Promise<string | null> {
        const settings = await this.getSettings();
        return settings.currentSessionId || null;
    }

    /**
     * Returns the currently active academic term ID.
     */
    async getActiveTermId(): Promise<string | null> {
        const settings = await this.getSettings();
        return settings.currentTermId || null;
    }
}
