import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SystemSettingsService } from '@modules/system/services/system-settings.service';

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private readonly systemSettingsService: SystemSettingsService,
    private readonly jwtService: JwtService,
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

    // Allow administrative users through
    let user = request.user;
    
    // If user is not yet attached (global guard runs before JwtAuthGuard),
    // try to manually verify the token to extract the role
    if (!user) {
      const token = this.extractToken(request);
      if (token) {
        try {
          user = this.jwtService.verify(token);
        } catch (e) {
          // Ignore errors - JwtAuthGuard will handle invalid tokens later
        }
      }
    }

    const adminRoles = ['super administrator', 'administrator', 'admin'];
    if (user && adminRoles.includes(user.role?.toLowerCase())) {
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

  private extractToken(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;

    const [scheme, token] = authHeader.split(' ');
    return scheme === 'Bearer' ? token : undefined;
  }
}
