import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OnlineClassesService } from '../services/online-classes.service';
import { CreateOnlineClassDto } from '../dto/create-online-class.dto';
import { UpdateOnlineClassDto } from '../dto/update-online-class.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { OnlineClassStatus } from '../entities/online-class.entity';

@ApiTags('Online Classes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('online-classes')
export class OnlineClassesController {
    constructor(private readonly onlineClassesService: OnlineClassesService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new online class' })
    create(@Body() createDto: CreateOnlineClassDto, @Request() req: any) {
        return this.onlineClassesService.create(createDto, req.user.tenantId);
    }

    @Get()
    @ApiOperation({ summary: 'Get all online classes with filters' })
    findAll(
        @Request() req: any,
        @Query('classId') classId?: string,
        @Query('subjectId') subjectId?: string,
        @Query('teacherId') teacherId?: string,
        @Query('status') status?: OnlineClassStatus,
    ) {
        return this.onlineClassesService.findAll(req.user.tenantId, { classId, subjectId, teacherId, status });
    }

    @Get('upcoming')
    @ApiOperation({ summary: 'Get upcoming online classes' })
    findUpcoming(@Request() req: any, @Query('classId') classId?: string) {
        return this.onlineClassesService.findUpcoming(req.user.tenantId, classId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific online class' })
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.onlineClassesService.findOne(id, req.user.tenantId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an online class' })
    update(@Param('id') id: string, @Body() updateDto: UpdateOnlineClassDto, @Request() req: any) {
        return this.onlineClassesService.update(id, updateDto, req.user.tenantId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an online class' })
    remove(@Param('id') id: string, @Request() req: any) {
        return this.onlineClassesService.remove(id, req.user.tenantId);
    }
}
