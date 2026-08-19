import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushToken } from './entities/push-token.entity';
import { PushNotificationService } from './services/push-notification.service';
import { PushTokenController } from './controllers/push-token.controller';

@Module({
    imports: [TypeOrmModule.forFeature([PushToken])],
    controllers: [PushTokenController],
    providers: [PushNotificationService],
    exports: [PushNotificationService],
})
export class NotificationsModule { }
