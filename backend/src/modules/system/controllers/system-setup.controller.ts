import { Controller, Get, Post, Body, UsePipes, ValidationPipe, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { Request } from 'express';
import { SystemSetupService } from '../services/system-setup.service';
import { InitializeSystemDto } from '../dtos/initialize-system.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

@Controller('system/setup')
export class SystemSetupController {
  constructor(private readonly systemSetupService: SystemSetupService) {}

  @Get('status')
  async getStatus() {
    return this.systemSetupService.getSetupStatus();
  }

  @Post('initialize')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', '..', '..', 'uploads', 'logos'),
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `primaryLogo-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async initialize(
    @Body() dto: InitializeSystemDto,
    @Req() req: Request,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.systemSetupService.initializeSystem(dto, req, file);
  }
}
