import { Controller, Post, Get, Body, HttpStatus, HttpCode, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto, RefreshTokenDto } from '@common/dtos/auth.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Public registration is disabled for security. 
  // All system users must be created by an administrator.
  /*
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user', description: 'Create a new user account with email, password, and user details' })
  @ApiBody({ type: CreateUserDto, description: 'User registration data' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }
  */

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user', description: 'Authenticate with email and password, receive JWT tokens' })
  @ApiBody({ type: LoginDto, description: 'Login credentials' })
  @ApiResponse({ status: 200, description: 'Login successful, returns access_token, refresh_token and user info' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token', description: 'Use refresh token to get a new access token' })
  @ApiBody({ type: RefreshTokenDto, description: 'Refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully, returns new access_token and refresh_token' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto.refresh_token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current user', description: 'Logs out the user and creates an audit trail' })
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  async logout(@Request() req: any) {
    // Stateless JWT means no server-side token invalidation is strictly required,
    // but hitting this endpoint triggers the AuditInterceptor to log "User Logged Out".
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile', description: 'Returns the latest profile data for the logged-in user' })
  @ApiResponse({ status: 200, description: 'Latest profile data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@Request() req: any) {
    return this.authService.getMe(req.user.id);
  }
}
