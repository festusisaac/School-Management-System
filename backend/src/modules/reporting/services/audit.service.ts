import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../../system/entities/activity-log.entity';
import { CommunicationLog } from '../../communication/entities/communication-log.entity';
import { Transaction, TransactionType } from '../../finance/entities/transaction.entity';
import { getFriendlyActionLabel } from '../../../common/utils/audit-labeler';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(CommunicationLog)
    private readonly communicationLogRepository: Repository<CommunicationLog>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async getOverview(tenantId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalActivityLogs,
      todayActivityLogs,
      totalCommunicationLogs,
      failedCommunicationLogs,
      deliveredCommunicationLogs,
      totalFinancialTransactions,
      recentActivity,
      recentCommunication,
      topActionsRaw,
      communicationStatusRaw,
    ] = await Promise.all([
      this.activityLogRepository.count({ where: { tenantId } }),
      this.activityLogRepository.createQueryBuilder('log')
        .where('log.tenantId = :tenantId', { tenantId })
        .andWhere('log.createdAt >= :startOfToday', { startOfToday })
        .getCount(),
      this.communicationLogRepository.count({ where: { tenantId } }),
      this.communicationLogRepository.createQueryBuilder('log')
        .where('log.tenantId = :tenantId', { tenantId })
        .andWhere('log.status IN (:...statuses)', { statuses: ['FAILED', 'BOUNCED'] })
        .getCount(),
      this.communicationLogRepository.createQueryBuilder('log')
        .where('log.tenantId = :tenantId', { tenantId })
        .andWhere('log.status IN (:...statuses)', { statuses: ['DELIVERED', 'OPENED'] })
        .getCount(),
      this.transactionRepository.count({
        where: {
          tenantId,
          type: TransactionType.FEE_PAYMENT,
        },
      }),
      this.activityLogRepository.createQueryBuilder('log')
        .leftJoin('users', 'u', 'log.userEmail = u.email AND u.tenantId = log.tenantId')
        .addSelect(['u.firstName', 'u.lastName'])
        .where('log.tenantId = :tenantId', { tenantId })
        .orderBy('log.createdAt', 'DESC')
        .take(8)
        .getRawAndEntities(),
      this.communicationLogRepository.find({
        where: { tenantId },
        order: { createdAt: 'DESC' },
        take: 8,
      }),
      this.activityLogRepository.createQueryBuilder('log')
        .select('COALESCE(log.label, log.action)', 'action')
        .addSelect('COUNT(*)', 'count')
        .where('log.tenantId = :tenantId', { tenantId })
        .groupBy('COALESCE(log.label, log.action)')
        .orderBy('count', 'DESC')
        .limit(6)
        .getRawMany(),
      this.communicationLogRepository.createQueryBuilder('log')
        .select('log.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('log.tenantId = :tenantId', { tenantId })
        .groupBy('log.status')
        .orderBy('count', 'DESC')
        .getRawMany(),
    ]);

    return {
      metrics: {
        totalActivityLogs,
        todayActivityLogs,
        totalCommunicationLogs,
        failedCommunicationLogs,
        deliveredCommunicationLogs,
        totalFinancialTransactions,
      },
      topActions: topActionsRaw.map((item) => ({
        action: item.action,
        count: Number(item.count || 0),
      })),
      communicationByStatus: communicationStatusRaw.map((item) => ({
        status: item.status,
        count: Number(item.count || 0),
      })),
      recentActivity: (recentActivity as any).entities.map((log: any, index: number) => {
        const rawItem = (recentActivity as any).raw[index];
        const fullName = rawItem.u_firstName ? `${rawItem.u_firstName} ${rawItem.u_lastName || ''}`.trim() : null;
        return {
          ...log,
          userEmail: fullName || log.userEmail,
          label: log.label || getFriendlyActionLabel(log.method || '', log.path || '', log.action),
          details: this.humanizeDetails(log.details),
        };
      }),
      recentCommunication,
    };
  }

  async getActivityLogs(
    tenantId: string,
    params: { search?: string; action?: string; portal?: string; page?: number; limit?: number; dateFrom?: string; dateTo?: string },
  ) {
    const page = Math.max(Number(params.page || 1), 1);
    const limit = Math.min(Math.max(Number(params.limit || 20), 1), 500);

    const query = this.activityLogRepository.createQueryBuilder('log')
      .leftJoin('users', 'u', 'log.userEmail = u.email AND u.tenantId = log.tenantId')
      .addSelect(['u.firstName', 'u.lastName'])
      .where('log.tenantId = :tenantId', { tenantId })
      .orderBy('log.createdAt', 'DESC');

    if (params.search) {
      query.andWhere(
        '(LOWER(log.userEmail) LIKE :search OR LOWER(log.action) LIKE :search OR LOWER(COALESCE(log.details, \'\')) LIKE :search OR LOWER(COALESCE(log.portal, \'\')) LIKE :search)',
        { search: `%${params.search.toLowerCase()}%` },
      );
    }

    if (params.action) {
      query.andWhere('log.action = :action', { action: params.action });
    }

    if (params.portal) {
      query.andWhere('log.portal = :portal', { portal: params.portal });
    }

    if (params.dateFrom) {
      query.andWhere('log.createdAt >= :dateFrom', { dateFrom: new Date(params.dateFrom) });
    }

    if (params.dateTo) {
      query.andWhere('log.createdAt <= :dateTo', { dateTo: new Date(params.dateTo) });
    }

    const queryResult = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getRawAndEntities();

    const items = queryResult.entities;
    const rawItems = queryResult.raw;
    const total = await query.getCount();

    const actions = await this.activityLogRepository.createQueryBuilder('log')
      .select('DISTINCT log.action', 'action')
      .orderBy('action', 'ASC')
      .getRawMany();

    return {
      items: items.map((log, index) => {
        const rawItem = rawItems[index];
        const fullName = rawItem.u_firstName ? `${rawItem.u_firstName} ${rawItem.u_lastName || ''}`.trim() : null;
        return {
          ...log,
          userEmail: fullName || log.userEmail,
          label: log.label || getFriendlyActionLabel(log.method || '', log.path || '', log.action),
          details: this.humanizeDetails(log.details),
        };
      }),
      total,
      page,
      limit,
      actions: actions.map((item) => item.action).filter(Boolean),
    };
  }

  async getCommunicationLogs(
    tenantId: string,
    params: { search?: string; type?: string; status?: string; page?: number; limit?: number; dateFrom?: string; dateTo?: string },
  ) {
    const page = Math.max(Number(params.page || 1), 1);
    const limit = Math.min(Math.max(Number(params.limit || 20), 1), 500);

    const query = this.communicationLogRepository.createQueryBuilder('log')
      .where('log.tenantId = :tenantId', { tenantId })
      .orderBy('log.createdAt', 'DESC');

    if (params.search) {
      query.andWhere(
        '(LOWER(log.recipient) LIKE :search OR LOWER(COALESCE(log.recipientName, \'\')) LIKE :search OR LOWER(COALESCE(log.subject, \'\')) LIKE :search OR LOWER(log.body) LIKE :search)',
        { search: `%${params.search.toLowerCase()}%` },
      );
    }

    if (params.type) {
      query.andWhere('log.type = :type', { type: params.type });
    }

    if (params.status) {
      query.andWhere('log.status = :status', { status: params.status });
    }

    if (params.dateFrom) {
      query.andWhere('log.createdAt >= :dateFrom', { dateFrom: new Date(params.dateFrom) });
    }

    if (params.dateTo) {
      query.andWhere('log.createdAt <= :dateTo', { dateTo: new Date(params.dateTo) });
    }

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const byStatus = await this.communicationLogRepository.createQueryBuilder('log')
      .select('log.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('log.tenantId = :tenantId', { tenantId })
      .groupBy('log.status')
      .orderBy('count', 'DESC')
      .getRawMany();

    return {
      items,
      total,
      page,
      limit,
      stats: byStatus.map((item) => ({
        status: item.status,
        count: Number(item.count || 0),
      })),
    };
  }

  /**
   * Converts raw JSON details into a short human-readable summary.
   */
  private humanizeDetails(details: string | null): string {
    if (!details) return '';
    try {
      const data = typeof details === 'string' ? JSON.parse(details) : details;
      if (typeof data !== 'object' || data === null) return String(details);

      // Filter out technical/sensitive keys
      const skipKeys = new Set([
        'tenantId', 'password', 'confirmPassword', 'oldPassword', 'newPassword',
        'id', 'userId', 'roleId', 'sessionId', 'termId',
        'createdAt', 'updatedAt', 'token', 'refreshToken',
      ]);

      const entries = Object.entries(data)
        .filter(([key]) => !skipKeys.has(key))
        .filter(([, val]) => val !== null && val !== undefined && val !== '')
        .slice(0, 4); // Limit to 4 most relevant fields

      if (entries.length === 0) return '';

      return entries.map(([key, value]) => {
        // Convert camelCase to readable
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
        
        let valStr = '';
        if (typeof value === 'object' && value !== null) {
          // Flatten simple object keys into comma-separated list
          valStr = Object.entries(value)
            .filter(([k, v]) => v !== null && v !== undefined && v !== '' && typeof v !== 'object')
            .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()}: ${v}`)
            .join(', ');
          
          if (!valStr) {
            // Nested object is too complex, skip stringification
            valStr = Array.isArray(value) ? `${value.length} items` : 'Updated object';
          }
        } else {
          valStr = String(value);
        }
        
        // Remove brackets or curly braces from beginning/end
        valStr = valStr.replace(/^[\{\[\]\"]+|[\{\[\]\"]+$/g, '').trim();

        // Truncate long values
        return `${label}: ${valStr.length > 50 ? valStr.substring(0, 47) + '...' : valStr}`;
      }).join(' • ');
    } catch {
      return '';
    }
  }
}
