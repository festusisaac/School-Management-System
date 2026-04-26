import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThan, Brackets } from 'typeorm';
import { Notice, NoticeAudience } from '../entities/notice.entity';
import { Staff } from '../../hr/entities/staff.entity';
import { CreateNoticeDto, UpdateNoticeDto } from '../dto/notice.dto';
import { SystemSettingsService } from '../../system/services/system-settings.service';

@Injectable()
export class NoticeboardService {
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    private readonly systemSettingsService: SystemSettingsService,
  ) {}

  async create(dto: CreateNoticeDto, userId: string, tenantId: string, email?: string): Promise<Notice> {
    // We try to find a Staff ID associated with this user
    // If not found (e.g. Super Admin), we use null (allowed by schema)
    let staffId: string | null = null;

    if (email) {
      const staff = await this.staffRepository.findOne({
        where: { email, tenantId }
      });
      if (staff) {
        staffId = staff.id;
      }
    }

    const notice = this.noticeRepository.create({
      ...dto,
      authorId: staffId,
      tenantId,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
    return await this.noticeRepository.save(notice);
  }

  async findAll(tenantId: string, audience?: NoticeAudience, schoolSectionId?: string): Promise<Notice[]> {
    const query = this.noticeRepository.createQueryBuilder('notice')
      .leftJoinAndSelect('notice.author', 'author')
      .where('notice.tenantId = :tenantId', { tenantId })
      .andWhere('notice.isActive = :isActive', { isActive: true })
      .andWhere(new Brackets(qb => {
        qb.where('notice.expiresAt IS NULL')
          .orWhere('notice.expiresAt > :now', { now: new Date() });
      }));

    if (audience) {
      if (audience === NoticeAudience.ALL) {
        // No additional filter needed for ALL
      } else {
        query.andWhere(new Brackets(qb => {
          qb.where('notice.targetAudience = :audience', { audience })
            .orWhere('notice.targetAudience = :all', { all: NoticeAudience.ALL });
        }));
      }
    }

    if (schoolSectionId) {
      query.andWhere(new Brackets(qb => {
        qb.where('notice.schoolSectionId = :schoolSectionId', { schoolSectionId })
          .orWhere('notice.schoolSectionId IS NULL'); // Also show global notices missing a section
      }));
    }

    // Sort: Sticky first, then by date
    query.orderBy('notice.isSticky', 'DESC')
         .addOrderBy('notice.createdAt', 'DESC');

    const notices = await query.getMany();
    
    // Resolve Placeholders
    const settings = await this.systemSettingsService.getSettings();
    for (const notice of notices) {
      notice.title = await this.resolvePlaceholders(notice.title, settings);
      notice.content = await this.resolvePlaceholders(notice.content, settings);
    }

    return notices;
  }

  async findAllForAdmin(tenantId: string, schoolSectionId?: string): Promise<Notice[]> {
    const query = this.noticeRepository.createQueryBuilder('notice')
      .leftJoinAndSelect('notice.author', 'author')
      .where('notice.tenantId = :tenantId', { tenantId });

    if (schoolSectionId) {
      query.andWhere(new Brackets(qb => {
        qb.where('notice.schoolSectionId = :schoolSectionId', { schoolSectionId })
          .orWhere('notice.schoolSectionId IS NULL');
      }));
    }

    query.orderBy('notice.isSticky', 'DESC')
         .addOrderBy('notice.createdAt', 'DESC');

    const notices = await query.getMany();
    
    // Resolve Placeholders
    const settings = await this.systemSettingsService.getSettings();
    for (const notice of notices) {
      notice.title = await this.resolvePlaceholders(notice.title, settings);
      notice.content = await this.resolvePlaceholders(notice.content, settings);
    }

    return notices;
  }

  async findOne(id: string, tenantId: string): Promise<Notice> {
    const notice = await this.noticeRepository.findOne({
      where: { id, tenantId },
      relations: ['author'],
    });

    if (!notice) {
      throw new NotFoundException(`Notice with ID ${id} not found`);
    }

    const settings = await this.systemSettingsService.getSettings();
    notice.title = await this.resolvePlaceholders(notice.title, settings);
    notice.content = await this.resolvePlaceholders(notice.content, settings);

    return notice;
  }

  private async resolvePlaceholders(text: string, settings: any): Promise<string> {
    if (!text) return text;
    let result = text;
    
    const placeholders: Record<string, string> = {
      '{school_name}': settings.schoolName || 'Our School',
      '{school_phone}': settings.schoolPhone || '',
      '{school_email}': settings.schoolEmail || '',
      '{school_address}': settings.schoolAddress || '',
      '{portal_url}': process.env.FRONTEND_URL || 'https://phjcschool.com.ng',
      '{current_date}': new Date().toLocaleDateString(),
      '{current_year}': new Date().getFullYear().toString(),
    };

    // Dynamic Academic Context
    if (text.includes('{active_session}') && settings.currentSessionId) {
        try {
            const session = await this.noticeRepository.manager.query(
                'SELECT name FROM academic_sessions WHERE id = $1', [settings.currentSessionId]
            );
            placeholders['{active_session}'] = session[0]?.name || '';
        } catch (e) {}
    }
    if (text.includes('{active_term}') && settings.currentTermId) {
        try {
            const term = await this.noticeRepository.manager.query(
                'SELECT name FROM academic_terms WHERE id = $1', [settings.currentTermId]
            );
            placeholders['{active_term}'] = term[0]?.name || '';
        } catch (e) {}
    }

    // Replace
    for (const [key, value] of Object.entries(placeholders)) {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(escapedKey, 'gi'), value);
    }

    return result;
  }

  async update(id: string, dto: UpdateNoticeDto, tenantId: string): Promise<Notice> {
    const notice = await this.findOne(id, tenantId);
    
    Object.assign(notice, {
      ...dto,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : notice.expiresAt,
    });

    return await this.noticeRepository.save(notice);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const notice = await this.findOne(id, tenantId);
    await this.noticeRepository.remove(notice);
  }
}
