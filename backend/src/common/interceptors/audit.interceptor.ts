import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActivityLogService } from '../../modules/system/services/activity-log.service';
import { getFriendlyActionLabel } from '../utils/audit-labeler';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly activityLogService: ActivityLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, user, headers } = request;
    const userAgent = headers['user-agent'];

    // Only log mutations (POST, PUT, PATCH, DELETE)
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (!isMutation) {
      return next.handle();
    }

    // Skip noisy/non-meaningful mutation routes
    const skipPatterns = [
      '/auth/me',
      '/auth/refresh',
      '/reporting/',
      '/dashboard/',
    ];
    if (skipPatterns.some(p => url.includes(p))) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          const { statusCode } = context.switchToHttp().getResponse();
          this.log(request, statusCode, responseBody);
        },
        error: (error) => {
          const statusCode = error.status || 500;
          this.log(request, statusCode);
        },
      }),
    );
  }

  private async log(request: any, statusCode: number, responseBody?: any) {
    const { method, url, ip, user, headers, body } = request;
    
    // Attempt to extract user info from response payload for login actions
    const authUser = responseBody?.user || user;
    
    const userEmail = authUser?.email || body?.email || 'anonymous';
    const tenantId = authUser?.tenantId;
    const userAgent = headers['user-agent'];
    const role = authUser?.role?.toLowerCase() || '';

    // Determine Portal
    let portal = 'PUBLIC';
    if (role.includes('admin') || role.includes('super')) {
      portal = 'ADMIN';
    } else if (role.includes('student')) {
      portal = 'STUDENT';
    } else if (role.includes('parent')) {
      portal = 'PARENT';
    } else if (role.includes('teacher') || role.includes('staff')) {
      portal = 'STAFF';
    }

    // Determine Action Name
    const action = `${method} ${url.split('?')[0]}`;
    const label = getFriendlyActionLabel(method, url.split('?')[0], action);

    // Details (Exclude sensitive fields like password)
    const detailsObj = { ...body };
    delete detailsObj.password;
    delete detailsObj.confirmPassword;
    delete detailsObj.oldPassword;
    delete detailsObj.newPassword;

    try {
      await this.activityLogService.logAction({
        userEmail,
        action,
        label,
        details: JSON.stringify(detailsObj).substring(0, 1000), // Limit detail size
        ipAddress: ip,
        tenantId,
        method,
        path: url.split('?')[0],
        statusCode,
        portal,
        userAgent,
      });
    } catch (err) {
      // Fail silently for audit logging to not block main operation
      console.error('Audit Logging failed:', err);
    }
  }
}
