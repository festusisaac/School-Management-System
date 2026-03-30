import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SystemSettingsService } from '@modules/system/services/system-settings.service';

@Injectable()
export class SystemSetupGuard implements CanActivate {
  constructor(
    private readonly systemSettingsService: SystemSettingsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const url: string = request.url || '';

    // Whitelist setup and basic auth endpoints
    if (
      url.includes('/system/setup') ||
      url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/verify-email')
    ) {
      return true;
    }

    const settings = await this.systemSettingsService.getSettings();

    if (settings.isInitialized) {
      return true;
    }

    // System not initialized, block all other requests
    throw new HttpException(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message: 'System not initialized. Please complete the setup wizard.',
        error: 'SystemNotInitialized',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
