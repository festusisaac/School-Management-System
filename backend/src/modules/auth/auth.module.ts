import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { InternalCommunicationModule } from '../internal-communication/internal-communication.module';
import { Staff } from '../hr/entities/staff.entity';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      global: true,
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          // Long-lived by default: the mobile app is used offline-first (admins/staff at
          // schools with intermittent connectivity). Forcing re-login on a short expiry
          // would strand them without internet exactly when offline support matters most.
          expiresIn: configService.get('JWT_EXPIRE', '90d'),
        },
      }),
    }),
    TypeOrmModule.forFeature([User, Role, Permission, Staff]),
    forwardRef(() => InternalCommunicationModule),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule { }
