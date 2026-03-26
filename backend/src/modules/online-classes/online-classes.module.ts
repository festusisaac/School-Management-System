import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnlineClassesController } from './controllers/online-classes.controller';
import { OnlineClassesService } from './services/online-classes.service';
import { OnlineClass } from './entities/online-class.entity';

@Module({
    imports: [TypeOrmModule.forFeature([OnlineClass])],
    controllers: [OnlineClassesController],
    providers: [OnlineClassesService],
    exports: [OnlineClassesService],
})
export class OnlineClassesModule {}
