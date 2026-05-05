import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Request,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { createReadStream } from 'fs';
import { Response } from 'express';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { DownloadCenterService } from './download-center.service';
import { CreateDownloadResourceDto, DownloadResourceFilterDto, UpdateDownloadResourceDto } from './dto/download-resource.dto';

const uploadPath = join(process.cwd(), 'uploads', 'download-center');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const resourceUpload = FileInterceptor('file', {
  storage: diskStorage({
    destination: uploadPath,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `resource-${uniqueSuffix}${extname(file.originalname)}`);
    },
  }),
});

@Controller('download-center')
@UseGuards(JwtAuthGuard)
export class DownloadCenterController {
  constructor(private readonly downloadCenterService: DownloadCenterService) {}

  @Post()
  @UseInterceptors(resourceUpload)
  create(
    @Body() dto: CreateDownloadResourceDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    this.ensureStaff(req.user);
    return this.downloadCenterService.create(dto, req.user.tenantId, req.user.id, file);
  }

  @Get()
  findAll(@Query() query: DownloadResourceFilterDto, @Request() req: any) {
    return this.downloadCenterService.findAll(req.user.tenantId, query, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.downloadCenterService.findOne(id, req.user.tenantId, req.user);
  }

  @Get(':id/file')
  async getFile(
    @Param('id') id: string,
    @Query('download') download: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    try {
      const resource = await this.downloadCenterService.findOne(id, req.user.tenantId, req.user);
      if (!resource.fileUrl) {
        throw new NotFoundException('No uploaded file is attached to this resource.');
      }

      const relativePath = resource.fileUrl.replace(/^\/+/, '');
      const filePath = join(process.cwd(), relativePath);

      if (!fs.existsSync(filePath)) {
        throw new NotFoundException('Resource file was not found on the server.');
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const mimeType = resource.mimeType || 'application/octet-stream';
      const safeTitle = resource.title.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '') || 'resource';
      const extension = extname(filePath);
      // Bypass IDM Interception completely:
      // IDM intercepts XHR requests that return recognizable file mime types or Content-Disposition.
      // We always send 'text/plain' and no disposition. The frontend handles recasting the blob
      // and forcing the download natively using a blob: URL.
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Accept-Ranges', 'bytes');

      const fileStream = createReadStream(filePath);

      // Gracefully handle client disconnect (e.g. IDM, browser cancellation)
      req.on('close', () => {
        fileStream.destroy();
      });

      fileStream.on('error', (streamErr) => {
        console.error(`[DownloadCenter] Stream error for ${filePath}: ${streamErr.message}`);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming file' });
        } else {
          res.end();
        }
      });

      fileStream.pipe(res);
    } catch (error: any) {
      console.error(`[DownloadCenter] getFile error: ${error.message}`);
      if (!res.headersSent) {
        if (error instanceof NotFoundException) {
          res.status(404).json({ message: error.message });
        } else if (error instanceof ForbiddenException) {
          res.status(403).json({ message: error.message });
        } else {
          res.status(500).json({ message: 'Error retrieving file' });
        }
      }
    }
  }

  @Patch(':id')
  @UseInterceptors(resourceUpload)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDownloadResourceDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    this.ensureStaff(req.user);
    return this.downloadCenterService.update(id, dto, req.user.tenantId, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    this.ensureStaff(req.user);
    return this.downloadCenterService.remove(id, req.user.tenantId);
  }

  @Post(':id/view')
  incrementView(@Param('id') id: string, @Request() req: any) {
    return this.downloadCenterService.incrementView(id, req.user.tenantId);
  }

  @Post(':id/download')
  incrementDownload(@Param('id') id: string, @Request() req: any) {
    return this.downloadCenterService.incrementDownload(id, req.user.tenantId);
  }

  private ensureStaff(user: any) {
    const role = (user?.roleObject?.name || user?.role || '').toString().toLowerCase().trim();
    const isStaff = ['admin', 'administrator', 'super admin', 'super administrator', 'teacher', 'librarian'].includes(role) || role.includes('admin');
    if (!isStaff) {
      throw new ForbiddenException('Only staff can manage download center resources.');
    }
  }
}
