import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThan, Brackets } from 'typeorm';
import { Notice, NoticeAudience } from '../entities/notice.entity';
import { Staff } from '../../hr/entities/staff.entity';
import { CreateNoticeDto, UpdateNoticeDto } from '../dto/notice.dto';

@Injectable()
export class NoticeboardService {
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
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

  async findAll(tenantId: string, audience?: NoticeAudience): Promise<Notice[]> {
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

    // Sort: Sticky first, then by date
    query.orderBy('notice.isSticky', 'DESC')
         .addOrderBy('notice.createdAt', 'DESC');

    return await query.getMany();
  }

  async findAllForAdmin(tenantId: string): Promise<Notice[]> {
    return await this.noticeRepository.find({
      where: { tenantId },
      relations: ['author'],
      order: { isSticky: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Notice> {
    const notice = await this.noticeRepository.findOne({
      where: { id, tenantId },
      relations: ['author'],
    });

    if (!notice) {
      throw new NotFoundException(`Notice with ID ${id} not found`);
    }

    return notice;
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
