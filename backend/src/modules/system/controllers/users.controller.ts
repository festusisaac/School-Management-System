import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  Patch,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from '../services/users.service';
import { CreateUserDto, UpdateUserDto } from '../dtos/users.dto';
import { JwtAuthGuard, RolesGuard } from '../../../guards/jwt-auth.guard';
import { Roles } from '../../../decorators/roles.decorator';

@ApiTags('System Settings - User Management')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all system users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get a single user' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new user' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req: any) {
    if (req.user.role !== 'admin' && req.user.sub !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a user' })
  patch(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req: any) {
    if (req.user.role !== 'admin' && req.user.role !== 'super administrator' && req.user.sub !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Post(':id/photo')
  @ApiOperation({ summary: 'Upload user profile photo' })
  @UseInterceptors(FileInterceptor('photo', {
    storage: diskStorage({
      destination: './uploads/users',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname);
        cb(null, `avatar-${uniqueSuffix}${ext}`);
      }
    })
  }))
  async uploadPhoto(@Param('id') id: string, @Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (req.user.role !== 'admin' && req.user.role !== 'super administrator' && req.user.sub !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const photoUrl = `/uploads/users/${file.filename}`;
    return this.usersService.update(id, { photo: photoUrl });
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a user' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
