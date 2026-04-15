import { Controller, Get, Body, Put, Delete, UseInterceptors, UploadedFile, Param, ParseEnumPipe } from '@nestjs/common';
import { SystemSettingsService } from '../services/system-settings.service';
import { UpdateSystemSettingDto } from '../dtos/update-system-setting.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Public } from '@decorators/public.decorator';

export enum LogoType {
    PRIMARY = 'primaryLogo',
    FAVICON = 'favicon',
    PRINT = 'printLogo',
    BURSAR_SIGNATURE = 'bursarSignature',
    PRINCIPAL_SIGNATURE = 'principalSignature',
    OG_IMAGE = 'ogImage',
}

@Controller('system/settings')
export class SystemSettingsController {
    constructor(private readonly settingsService: SystemSettingsService) { }

    @Public()
    @Get('public')
    getPublicSettings() {
        return this.settingsService.getPublicSettings();
    }

    @Get()
    getSettings() {
        return this.settingsService.getSettings();
    }

    @Put()
    updateSettings(@Body() updateDto: UpdateSystemSettingDto) {
        return this.settingsService.updateSettings(updateDto);
    }

    @Put('logo/:type')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: join(__dirname, '..', '..', '..', '..', 'uploads', 'logos'),
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = extname(file.originalname);
                    cb(null, `${req.params.type}-${uniqueSuffix}${ext}`);
                },
            }),
        }),
    )
    uploadLogo(
        @Param('type', new ParseEnumPipe(LogoType)) type: LogoType,
        @UploadedFile() file: Express.Multer.File,
    ) {
        // Generate the URL or relative path to save
        const relativePath = `uploads/logos/${file.filename}`;
        return this.settingsService.updateLogo(type, relativePath);
    }

    @Delete('logo/:type')
    deleteLogo(@Param('type', new ParseEnumPipe(LogoType)) type: LogoType) {
        return this.settingsService.deleteLogo(type);
    }
}
