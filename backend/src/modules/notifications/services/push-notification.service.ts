import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { PushToken } from '../entities/push-token.entity';

export interface PushPayload {
    title: string;
    body: string;
    data?: Record<string, any>;
}

@Injectable()
export class PushNotificationService {
    private readonly logger = new Logger(PushNotificationService.name);
    private readonly expo = new Expo();

    constructor(
        @InjectRepository(PushToken)
        private readonly tokenRepo: Repository<PushToken>,
        private readonly entityManager: EntityManager,
    ) { }

    async registerToken(userId: string, tenantId: string, token: string, platform: string): Promise<void> {
        if (!Expo.isExpoPushToken(token)) {
            this.logger.warn(`Ignoring non-Expo push token: ${token}`);
            return;
        }
        const existing = await this.tokenRepo.findOne({ where: { token } });
        if (existing) {
            existing.userId = userId;
            existing.tenantId = tenantId;
            existing.platform = platform;
            await this.tokenRepo.save(existing);
        } else {
            await this.tokenRepo.save(this.tokenRepo.create({ userId, tenantId, token, platform }));
        }
    }

    async unregisterToken(token: string): Promise<void> {
        await this.tokenRepo.delete({ token });
    }

    /** Send a push notification to every device registered to the given user IDs. */
    async sendToUserIds(userIds: string[], payload: PushPayload): Promise<void> {
        const ids = [...new Set(userIds.filter(Boolean))];
        if (!ids.length) return;

        const tokens = await this.tokenRepo.find({ where: { userId: In(ids) } });
        if (!tokens.length) return;

        const messages: ExpoPushMessage[] = tokens
            .filter((t) => Expo.isExpoPushToken(t.token))
            .map((t) => ({
                to: t.token,
                sound: 'default',
                title: payload.title,
                body: payload.body,
                data: payload.data || {},
                // Android requires a channel (Android 8+) to show a heads-up banner + sound —
                // without a match to a channel the device actually has, it's delivered silently
                // with no visible UI. Must match the channel id created on-device.
                channelId: 'default',
                // Ensures FCM wakes the device / delivers promptly instead of deferring until
                // the app is next opened (which is exactly the symptom without this).
                priority: 'high',
            }));

        const chunks = this.expo.chunkPushNotifications(messages);
        const invalidTokens: string[] = [];

        for (const chunk of chunks) {
            try {
                const receipts = await this.expo.sendPushNotificationsAsync(chunk);
                receipts.forEach((receipt, i) => {
                    if (receipt.status === 'error' && (receipt as any).details?.error === 'DeviceNotRegistered') {
                        invalidTokens.push(chunk[i].to as string);
                    }
                    if (receipt.status === 'error') {
                        this.logger.warn(`Push error: ${(receipt as any).message}`);
                    }
                });
            } catch (e: any) {
                this.logger.error(`Push send failed: ${e.message}`);
            }
        }

        if (invalidTokens.length) {
            await this.tokenRepo.delete({ token: In(invalidTokens) });
        }
    }

    /** All logged-in staff (users whose email matches a staff record) for a tenant. */
    async getStaffUserIds(tenantId: string): Promise<string[]> {
        const rows = await this.entityManager.query(
            `SELECT DISTINCT u.id FROM users u
             INNER JOIN staff s ON LOWER(s.email) = LOWER(u.email) AND s."tenantId" = u."tenantId"
             WHERE u."tenantId" = $1`,
            [tenantId],
        );
        return rows.map((r: any) => r.id);
    }

    /** All students with a linked user account for a tenant (optionally a specific set of students). */
    async getStudentUserIds(tenantId: string, studentIds?: string[]): Promise<string[]> {
        const params: any[] = [tenantId];
        let where = `"tenantId" = $1 AND "userId" IS NOT NULL AND "isActive" = true`;
        if (studentIds && studentIds.length) {
            params.push(studentIds);
            where += ` AND id = ANY($2)`;
        }
        const rows = await this.entityManager.query(`SELECT "userId" as id FROM students WHERE ${where}`, params);
        return rows.map((r: any) => r.id);
    }

    /** Resolve the user ID linked to a staff member by email (e.g. for leave approval pushes). */
    async getStaffUserIdByEmail(email: string, tenantId: string): Promise<string | null> {
        const rows = await this.entityManager.query(
            `SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND "tenantId" = $2 LIMIT 1`,
            [email, tenantId],
        );
        return rows[0]?.id || null;
    }
}
