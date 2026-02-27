import { Controller, Get, Post, Body, Query, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { PayrollService } from '../services/payroll.service';
import { CreatePayrollDto, UpdatePayrollStatusDto, BulkCreatePayrollDto } from '../dto/payroll.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('hr/payroll')
@UseGuards(JwtAuthGuard)
export class PayrollController {
    constructor(private readonly payrollService: PayrollService) { }

    @Post()
    create(@Body() createPayrollDto: CreatePayrollDto) {
        return this.payrollService.create(createPayrollDto);
    }

    @Post('bulk')
    bulkGenerate(@Body() bulkCreateDto: BulkCreatePayrollDto) {
        return this.payrollService.bulkGenerate(bulkCreateDto);
    }

    @Get()
    findAll(
        @Query('month') month?: number,
        @Query('year') year?: number,
        @Query('staffId') staffId?: string,
    ) {
        return this.payrollService.findAll({
            month: month ? Number(month) : undefined,
            year: year ? Number(year) : undefined,
            staffId,
        });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.payrollService.findOne(id);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id') id: string,
        @Body() updateDto: UpdatePayrollStatusDto,
    ) {
        return this.payrollService.updateStatus(id, updateDto);
    }

    @Get('analytics')
    getAnalytics(
        @Query('month') month: number,
        @Query('year') year: number,
    ) {
        return this.payrollService.getAnalytics(Number(month), Number(year));
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.payrollService.remove(id);
    }
}
