import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException 
      ? exception.getResponse() as any 
      : { message: 'Internal server error', error: 'Internal Server Error' };

    // Capture 500 errors in Sentry
    if (status >= 500) {
      Sentry.captureException(exception);
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exceptionResponse.message || exception.message,
      error: exceptionResponse.error || 'Internal Server Error',
    };

    this.logger.error(`[${request.method}] ${request.url} - ${status}`, {
      ...errorResponse,
      body: request.body,
    });

    response.status(status).json(errorResponse);
  }
}
