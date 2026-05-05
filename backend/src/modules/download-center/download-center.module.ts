import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from '../students/entities/student.entity';
import { DownloadCenterController } from './download-center.controller';
import { DownloadCenterService } from './download-center.service';
import { DownloadResource } from './entities/download-resource.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DownloadResource, Student])],
  controllers: [DownloadCenterController],
  providers: [DownloadCenterService],
  exports: [DownloadCenterService],
})
export class DownloadCenterModule {}
