import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { logger } from '@config/logger.config';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, user, body } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(
        (response) => {
          const duration = Date.now() - startTime;
          const { statusCode } = context.switchToHttp().getResponse();

          logger.info(
            `${method} ${url} - ${statusCode} - ${duration}ms`,
            {
              method,
              url,
              statusCode,
              duration,
              ip,
              userId: user?.id,
              userEmail: user?.email,
            },
          );
        },
        (error) => {
          const duration = Date.now() - startTime;

          logger.error(
            `${method} ${url} - ${error.status || 500} - ${duration}ms`,
            {
              method,
              url,
              statusCode: error.status || 500,
              duration,
              ip,
              userId: user?.id,
              userEmail: user?.email,
              error: error.message,
              stack: error.stack,
            },
          );
        },
      ),
    );
  }
}
