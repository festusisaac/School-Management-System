import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnlineClassesController } from './controllers/online-classes.controller';
import { OnlineClassesService } from './services/online-classes.service';
import { OnlineClass } from './entities/online-class.entity';
import { CommunicationModule } from '../communication/communication.module';
import { Student } from '../students/entities/student.entity';
import { HrModule } from '../hr/hr.module';
import { StudentsModule } from '../students/students.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([OnlineClass, Student]),
        CommunicationModule,
        HrModule,
        forwardRef(() => StudentsModule),
    ],
    controllers: [OnlineClassesController],
    providers: [OnlineClassesService],
    exports: [OnlineClassesService],
})
export class OnlineClassesModule {}
