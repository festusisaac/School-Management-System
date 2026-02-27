/// <reference types="jest" />
/**
 * @jest-environment node
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from '../src/modules/auth/auth.module';
import { AuthService } from '../src/modules/auth/auth.service';
import { User } from '../src/modules/auth/entities/user.entity';
import { DataSource } from 'typeorm';

describe('Auth Module E2E', () => {
  let app: INestApplication;
  let authService: AuthService;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DATABASE_HOST || 'localhost',
          port: parseInt(process.env.DATABASE_PORT || '5432', 10),
          username: process.env.DATABASE_USER || 'test_user',
          password: process.env.DATABASE_PASSWORD || 'test_password',
          database: process.env.DATABASE_NAME || 'test_db',
          entities: [User],
          synchronize: true,
          dropSchema: true,
        }),
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    const configService = app.get(ConfigService);
    app.setGlobalPrefix(`api/${configService.get('API_VERSION')}`);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test@12345',
          firstName: 'John',
          lastName: 'Doe',
          role: 'student' as any,
        })
        .expect(201)
        .expect((res: request.Response) => {
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toBe('test@example.com');
          expect(res.body.user.firstName).toBe('John');
          expect(res.body.message).toContain('registered successfully');
        });
    });

    it('should not register user with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test@12345',
          firstName: 'Jane',
          lastName: 'Doe',
          role: 'student' as any,
        })
        .expect(400);
    });

    it('should not register user with weak password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'test2@example.com',
          password: 'weak',
          firstName: 'Jane',
          lastName: 'Doe',
          role: 'student' as any,
        })
        .expect(400);
    });

    it('should not register duplicate email', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'Test@12345',
          firstName: 'John',
          lastName: 'Duplicate',
          role: 'student' as any,
        });

      // Attempt duplicate registration
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'Test@12345',
          firstName: 'Jane',
          lastName: 'Duplicate',
          role: 'student' as any,
        })
        .expect(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeAll(async () => {
      // Create a test user
      await authService.register({
        email: 'login-test@example.com',
        password: 'Test@12345',
        firstName: 'Login',
        lastName: 'Test',
        role: 'student' as any,
      });
    });

    it('should login successfully with correct credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'Test@12345',
        })
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.refresh_token).toBeDefined();
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toBe('login-test@example.com');
        });
    });

    it('should not login with wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'WrongPassword',
        })
        .expect(401);
    });

    it('should not login with non-existent user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test@12345',
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      // Register and login to get refresh token
      await authService.register({
        email: 'refresh-test@example.com',
        password: 'Test@12345',
        firstName: 'Refresh',
        lastName: 'Test',
        role: 'student' as any,
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'refresh-test@example.com',
          password: 'Test@12345',
        });

      refreshToken = response.body.refresh_token;
    });

    it('should refresh token successfully', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refresh_token: refreshToken,
        })
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body.access_token).toBeDefined();
          expect(res.body.refresh_token).toBeDefined();
          expect(res.body.access_token).not.toBe(refreshToken);
        });
    });

    it('should not refresh with invalid token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refresh_token: 'invalid-token',
        })
        .expect(401);
    });
  });
});
