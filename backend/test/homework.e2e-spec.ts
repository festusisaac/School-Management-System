import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { HomeworkModule } from '../src/modules/homework/homework.module';
import { Homework } from '../src/modules/homework/entities/homework.entity';
import { Student } from '../src/modules/students/entities/student.entity';

describe('Homework Module E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Homework, Student],
          synchronize: true,
          dropSchema: true,
        }),
        HomeworkModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /homework should be protected (401)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/homework')
      .expect(401);
  });

  it('POST /homework should be protected (401)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/homework')
      .expect(401);
  });
});
