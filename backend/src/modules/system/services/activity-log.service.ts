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

  async logAction(userEmail: string, action: string, details?: string, ipAddress?: string): Promise<ActivityLog> {
    const log = this.activityLogRepository.create({
      userEmail,
      action,
      details,
      ipAddress,
    });
    return this.activityLogRepository.save(log);
  }

  async getLogs(limit = 100): Promise<ActivityLog[]> {
    return this.activityLogRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
