import { Body, Controller, Delete, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { PushNotificationService } from '../services/push-notification.service';

@Controller('notifications/push-tokens')
@UseGuards(JwtAuthGuard)
export class PushTokenController {
    constructor(private readonly pushService: PushNotificationService) { }

    /** Register (or refresh) this device's Expo push token for the logged-in user. */
    @Post()
    async register(@Body() dto: { token: string; platform?: string }, @Request() req: any) {
        await this.pushService.registerToken(req.user.id, req.user.tenantId, dto.token, dto.platform || 'android');
        return { success: true };
    }

    /** Called on logout so a shared/reused device stops receiving this user's pushes. */
    @Delete()
    async unregister(@Query('token') token: string) {
        if (token) await this.pushService.unregisterToken(token);
        return { success: true };
    }
}
