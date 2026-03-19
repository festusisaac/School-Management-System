import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesPermissionsService } from '../services/roles-permissions.service';
import { CreateRoleDto, UpdateRoleDto } from '../dtos/roles.dto';
import { JwtAuthGuard, RolesGuard } from '../../../guards/jwt-auth.guard';
import { Roles } from '../../../decorators/roles.decorator';

@ApiTags('System Settings - Roles & Permissions')
@Controller('system/roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('admin', 'principal', 'staff') // Allow administrative roles
export class RolesPermissionsController {
  constructor(private readonly rolesPermissionsService: RolesPermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  findAll() {
    return this.rolesPermissionsService.findAllRoles();
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Get all available permissions' })
  findAllPermissions() {
    return this.rolesPermissionsService.findAllPermissions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single role' })
  findOne(@Param('id') id: string) {
    return this.rolesPermissionsService.findOneRole(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesPermissionsService.createRole(createRoleDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a role' })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesPermissionsService.updateRole(id, updateRoleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role' })
  remove(@Param('id') id: string) {
    return this.rolesPermissionsService.deleteRole(id);
  }
}
