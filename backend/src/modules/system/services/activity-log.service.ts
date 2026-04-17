import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../entities/activity-log.entity';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
  ) {}

  async logAction(data: {
    userEmail: string;
    action: string;
    details?: string;
    ipAddress?: string;
    tenantId?: string;
    method?: string;
    path?: string;
    statusCode?: number;
    portal?: string;
    userAgent?: string;
    label?: string;
  }): Promise<ActivityLog> {
    const log = this.activityLogRepository.create(data);
    return this.activityLogRepository.save(log);
  }

  async getLogs(limit = 100): Promise<ActivityLog[]> {
    return this.activityLogRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
