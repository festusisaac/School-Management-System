import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    UseInterceptors,
    UploadedFiles,
    Request,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { StaffService } from '../services/staff.service';
import { CreateStaffDto } from '../dto/create-staff.dto';
import { UpdateStaffDto } from '../dto/update-staff.dto';
import { StaffFilterDto } from '../dto/staff-filter.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Controller('hr/staff')
@UseGuards(JwtAuthGuard)
export class StaffController {
    constructor(
        private readonly staffService: StaffService,
        @InjectQueue('staff-import') private readonly staffImportQueue: Queue
    ) { }

    @Get()
    async findAll(@Query() filters: StaffFilterDto, @Request() req: any) {
        return this.staffService.findAll(filters, req.user.tenantId);
    }

    @Get('dashboard/stats')
    async getTeacherDashboardStats(
        @Query('sessionId') sessionId: string,
        @Query('termId') termId: string,
        @Request() req: any
    ) {
        return this.staffService.getTeacherDashboardStats(req.user.email, req.user.tenantId, sessionId, termId);
    }

    @Get('statistics')
    async getStatistics(@Query('sectionId') sectionId: string, @Request() req: any) {
        return this.staffService.getStatistics(req.user.tenantId, sectionId);
    }

    @Get('profile/me')
    async getMyProfile(@Request() req: any) {
        return this.staffService.findByEmail(req.user.email);
    }


    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req: any) {
        return this.staffService.findOne(id, req.user.tenantId);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'photo', maxCount: 1 },
        { name: 'resume', maxCount: 1 },
        { name: 'joiningLetter', maxCount: 1 },
        { name: 'resignationLetter', maxCount: 1 },
        { name: 'otherDocuments', maxCount: 5 },
        { name: 'certificates', maxCount: 10 },
        { name: 'idProof', maxCount: 1 },
        { name: 'signature', maxCount: 1 },
    ], {
        storage: diskStorage({
            destination: './uploads/staff',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = extname(file.originalname);
                cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
            }
        })
    }))
    async create(
        @Body() createStaffDto: CreateStaffDto,
        @UploadedFiles() files: {
            photo?: Express.Multer.File[],
            resume?: Express.Multer.File[],
            joiningLetter?: Express.Multer.File[],
            resignationLetter?: Express.Multer.File[],
            otherDocuments?: Express.Multer.File[],
            certificates?: Express.Multer.File[],
            idProof?: Express.Multer.File[],
            signature?: Express.Multer.File[]
        },
        @Request() req: any
    ) {
        return this.staffService.create(createStaffDto, req.user.tenantId, files);
    }

    @Put(':id')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'photo', maxCount: 1 },
        { name: 'resume', maxCount: 1 },
        { name: 'joiningLetter', maxCount: 1 },
        { name: 'resignationLetter', maxCount: 1 },
        { name: 'otherDocuments', maxCount: 5 },
        { name: 'certificates', maxCount: 10 },
        { name: 'idProof', maxCount: 1 },
        { name: 'signature', maxCount: 1 },
    ], {
        storage: diskStorage({
            destination: './uploads/staff',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = extname(file.originalname);
                cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
            }
        })
    }))
    async update(
        @Param('id') id: string,
        @Body() updateStaffDto: UpdateStaffDto,
        @UploadedFiles() files: {
            photo?: Express.Multer.File[],
            resume?: Express.Multer.File[],
            joiningLetter?: Express.Multer.File[],
            resignationLetter?: Express.Multer.File[],
            otherDocuments?: Express.Multer.File[],
            certificates?: Express.Multer.File[],
            idProof?: Express.Multer.File[],
            signature?: Express.Multer.File[]
        },
        @Request() req: any
    ) {
        return this.staffService.update(id, updateStaffDto, req.user.tenantId, files);
    }


    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string, @Request() req: any) {
        await this.staffService.remove(id, req.user.tenantId);
    }

    // --- Bulk Import Endpoints ---

    @Post('bulk/validate')
    async validateBulk(@Body() data: any[], @Request() req: any) {
        return this.staffService.validateBulk(data, req.user.tenantId);
    }

    @Post('bulk/import')
    @HttpCode(HttpStatus.ACCEPTED)
    async importBulk(@Body() data: any[], @Request() req: any) {
        const job = await this.staffImportQueue.add('import-staff', {
            data,
            tenantId: req.user.tenantId,
            userEmail: req.user.email
        });
        return { jobId: job.id };
    }

    @Get('bulk/import/status/:jobId')
    async getImportStatus(@Param('jobId') jobId: string) {
        const job = await this.staffImportQueue.getJob(jobId);
        if (!job) {
            throw new Error('Job not found');
        }

        const state = await job.getState();
        const progress = job.progress();
        const result = job.returnvalue;
        const failedReason = job.failedReason;

        return {
            id: job.id,
            state,
            progress,
            result,
            failedReason
        };
    }
}
