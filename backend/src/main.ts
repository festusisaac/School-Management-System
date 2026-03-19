import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import { logger as winstonLogger } from './config/logger.config';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ instance: winstonLogger }),
  });
  const configService = app.get(ConfigService);

  // Global Prefix
  app.setGlobalPrefix(`api/${configService.get('API_VERSION')}`);

  // CORS Configuration
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:3001').split(','),
    credentials: true,
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Global Filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global Interceptors
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor());

  // Swagger (API docs) - only enable in non-production by default
  const enableDocs = configService.get('ENABLE_SWAGGER', 'true') === 'true';
  if (enableDocs) {
    const config = new DocumentBuilder()
      .setTitle('School Management System API')
      .setDescription('SMS Backend API documentation')
      .setVersion(configService.get('API_VERSION') || 'v1')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${configService.get('API_PREFIX') || `api/${configService.get('API_VERSION')}`}/docs`, app, document);
  }

  const port = configService.get('PORT', 3000);
  await app.listen(port);

  winstonLogger.info(`🚀 Application is running on: http://localhost:${port}`);
  winstonLogger.info(`📝 API Prefix: api/${configService.get('API_VERSION')}`);
  winstonLogger.info(`🌍 Environment: ${configService.get('NODE_ENV')}`);
}

bootstrap();
