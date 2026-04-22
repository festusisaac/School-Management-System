import {
    Injectable,
    CanActivate,
    ExecutionContext,
    PayloadTooLargeException,
} from '@nestjs/common';
import { SystemSettingsService } from '../modules/system/services/system-settings.service';

/**
 * Global Guard to enforce the file upload size limit defined in System Settings.
 * This runs before Multer/Interceptors and checks the Content-Length header.
 */
@Injectable()
export class FileSizeGuard implements CanActivate {
    constructor(private readonly systemSettingsService: SystemSettingsService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const contentType = request.headers['content-type'];

        // Only check multipart requests (potential file uploads)
        if (contentType && contentType.includes('multipart/form-data')) {
            const contentLength = request.headers['content-length'];
            
            if (contentLength) {
                const settings = await this.systemSettingsService.getSettings();
                const maxSizeMb = settings.maxFileUploadSizeMb || 3; // Default 3MB if not set
                const maxSizeBytes = maxSizeMb * 1024 * 1024;

                if (parseInt(contentLength, 10) > maxSizeBytes) {
                    throw new PayloadTooLargeException(
                        `Request size (${(parseInt(contentLength, 10) / (1024 * 1024)).toFixed(2)}MB) exceeds the system allowed limit of ${maxSizeMb}MB.`,
                    );
                }
            }
        }

        return true;
    }
}
