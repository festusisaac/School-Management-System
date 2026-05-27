import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { Student } from '../students/entities/student.entity';
import { Transaction } from '../finance/entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Transaction]),
  ],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
