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

@Controller('hr/staff')
@UseGuards(JwtAuthGuard)
export class StaffController {
    constructor(private readonly staffService: StaffService) { }

    @Get()
    async findAll(@Query() filters: StaffFilterDto, @Request() req: any) {
        return this.staffService.findAll(filters, req.user.tenantId);
    }

    @Get('statistics')
    async getStatistics(@Request() req: any) {
        return this.staffService.getStatistics(req.user.tenantId);
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
}
