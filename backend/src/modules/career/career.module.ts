import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobPosting } from './entities/job-posting.entity';
import { CareerService } from './services/career.service';
import { CareerController } from './controllers/career.controller';

@Module({
  imports: [TypeOrmModule.forFeature([JobPosting])],
  controllers: [CareerController],
  providers: [CareerService],
  exports: [CareerService],
})
export class CareerModule {}
