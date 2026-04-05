import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { CreateUserDto, LoginDto } from '@common/dtos/auth.dto';
import { User } from './entities/user.entity';
import { EmailService } from '@modules/internal-communication/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) { }

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      tenantId: uuidv4(),
    });

    await this.usersRepository.save(user);

    // Send registration email (async, don't block response)
    this.emailService
      .sendRegistrationEmail(
        user.email,
        user.firstName,
        `${process.env.FRONTEND_URL || 'http://localhost:3001'}/verify-email?token=sample`,
      )
      .catch((err: any) => this.logger.error('Failed to send registration email', err));

    const { password, ...userWithoutPassword } = user;
    return {
      message: 'User registered successfully. Please check your email to verify your account.',
      user: userWithoutPassword,
    };
  }

  async login(loginDto: LoginDto) {
    this.logger.debug(`Login attempt for email: ${loginDto.email}`);

    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email },
      relations: ['roleObject', 'roleObject.permissions'],
    });

    if (!user) {
      this.logger.warn(`User not found: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.debug(`User found: ${user.email}, comparing password...`);

    const passwordMatch = await bcrypt.compare(loginDto.password, user.password);
    this.logger.debug(`Password match result: ${passwordMatch}`);

    if (!passwordMatch) {
      this.logger.warn(`Password mismatch for user: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.debug(`Password valid for user: ${loginDto.email}`);

    const { access_token, refresh_token } = await this.generateTokens(user);

    const { password, ...userWithoutPassword } = user;
    return {
      access_token,
      refresh_token,
      user: {
        ...userWithoutPassword,
        mustChangePassword: user.mustChangePassword
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const refreshSecret = this.configService.get<string>('REFRESH_TOKEN_SECRET') ||
        this.configService.get<string>('JWT_SECRET');

      if (!refreshSecret) {
        this.logger.error('REFRESH_TOKEN_SECRET or JWT_SECRET not configured');
        throw new UnauthorizedException('Token configuration error');
      }

      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });

      const user = await this.usersRepository.findOne({
        where: { id: payload.sub },
        relations: ['roleObject', 'roleObject.permissions'],
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const { access_token, refresh_token } = await this.generateTokens(user);

      return {
        access_token,
        refresh_token,
      };
    } catch (error) {
      this.logger.error('Refresh token validation failed', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getMe(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['roleObject', 'roleObject.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      mustChangePassword: user.mustChangePassword
    };
  }

  private async generateTokens(user: User) {
    const permissions = user.roleObject?.permissions?.map(p => p.slug) || [];
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.roleObject?.name?.toLowerCase() || user.role,
      permissions,
      tenantId: user.tenantId,
    };

    const access_token = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    const refreshSecret = this.configService.get<string>('REFRESH_TOKEN_SECRET') ||
      this.configService.get<string>('JWT_SECRET');

    if (!refreshSecret) {
      this.logger.error('REFRESH_TOKEN_SECRET or JWT_SECRET not configured');
      throw new Error('Token configuration error');
    }

    const refresh_token = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: '7d',
    });

    return { access_token, refresh_token };
  }
}
