import { Controller, Get, Body, Put, Delete, UseInterceptors, UploadedFile, Param, ParseEnumPipe, UseGuards, Request } from '@nestjs/common';
import { SystemSettingsService } from '../services/system-settings.service';
import { UpdateSystemSettingDto } from '../dtos/update-system-setting.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Public } from '@decorators/public.decorator';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';
import { Permissions } from '../../../decorators/permissions.decorator';

export enum LogoType {
    PRIMARY = 'primaryLogo',
    FAVICON = 'favicon',
    PRINT = 'printLogo',
    BURSAR_SIGNATURE = 'bursarSignature',
    PRINCIPAL_SIGNATURE = 'principalSignature',
    OG_IMAGE = 'ogImage',
}

// Sensitive fields that must never be exposed to non-admin users.
const SECRET_SETTING_FIELDS = [
    'paystackSecretKey',
    'flutterwaveSecretKey',
    'squadSecretKey',
    'monnifyApiKey',
    'monnifySecretKey',
    'remitaApiKey',
    'interswitchSecretKey',
];

const ADMIN_ROLES = ['admin', 'administrator', 'super administrator'];

@Controller('system/settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SystemSettingsController {
    constructor(private readonly settingsService: SystemSettingsService) { }

    // Whether this user is allowed to manage settings (and therefore see secrets):
    // super admins, admins, or anyone granted a settings permission.
    private canManageSettings(req: any): boolean {
        const role = (req.user?.role || '').toLowerCase();
        const perms: string[] = req.user?.permissions || [];
        return ADMIN_ROLES.includes(role) || perms.some((p) => p && p.startsWith('settings:'));
    }

    @Public()
    @Get('public')
    getPublicSettings() {
        return this.settingsService.getPublicSettings();
    }

    // Any authenticated user can read operational settings (session/term names,
    // prefixes, currency, etc.), but payment secrets are stripped unless the user
    // is allowed to manage settings.
    @Get()
    async getSettings(@Request() req: any) {
        const settings = await this.settingsService.getSettings();
        if (settings && !this.canManageSettings(req)) {
            SECRET_SETTING_FIELDS.forEach((f) => {
                if (f in (settings as any)) (settings as any)[f] = undefined;
            });
        }
        return settings;
    }

    @Put()
    @Permissions('settings:general')
    updateSettings(@Body() updateDto: UpdateSystemSettingDto) {
        return this.settingsService.updateSettings(updateDto);
    }

    @Put('logo/:type')
    @Permissions('settings:general')
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
    @Permissions('settings:general')
    deleteLogo(@Param('type', new ParseEnumPipe(LogoType)) type: LogoType) {
        return this.settingsService.deleteLogo(type);
    }
}
