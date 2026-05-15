import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './controllers/search.controller';
import { SearchService } from './services/search.service';
import { Student } from '../students/entities/student.entity';
import { Staff } from '../hr/entities/staff.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Student, Staff]),
    ],
    controllers: [SearchController],
    providers: [SearchService],
    exports: [SearchService],
})
export class SearchModule {}
