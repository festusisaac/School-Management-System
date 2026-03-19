import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SystemSettingsService } from '@modules/system/services/system-settings.service';

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private readonly systemSettingsService: SystemSettingsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const url: string = request.url || '';

    // Always allow auth and settings endpoints so admin can log in and toggle mode off
    if (
      url.includes('/auth/') ||
      url.includes('/system/settings')
    ) {
      return true;
    }

    const settings = await this.systemSettingsService.getSettings();

    if (!settings.isMaintenanceMode) {
      return true;
    }

    // Allow admin users through
    const user = request.user;
    if (user && user.role === 'Admin') {
      return true;
    }

    throw new HttpException(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'System is currently under maintenance. Please try again later.',
        error: 'Service Unavailable',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
