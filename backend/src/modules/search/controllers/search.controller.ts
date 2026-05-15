import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { SearchService } from '../services/search.service';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
    constructor(private readonly searchService: SearchService) {}

    @Get('global')
    async globalSearch(@Query('q') query: string, @Request() req: any) {
        const tenantId = req.user.tenantId;
        const userRole = req.user.role || req.user.roleObject?.name || 'staff';
        
        return this.searchService.globalSearch(query, tenantId, userRole);
    }
}
