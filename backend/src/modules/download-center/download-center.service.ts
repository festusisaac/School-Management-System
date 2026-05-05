import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { extname } from 'path';
import { Student } from '../students/entities/student.entity';
import {
  DownloadResource,
  DownloadResourceStatus,
  DownloadResourceType,
  DownloadResourceVisibility,
} from './entities/download-resource.entity';
import { CreateDownloadResourceDto, DownloadResourceFilterDto, UpdateDownloadResourceDto } from './dto/download-resource.dto';

@Injectable()
export class DownloadCenterService {
  constructor(
    @InjectRepository(DownloadResource)
    private readonly resourceRepo: Repository<DownloadResource>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  async create(dto: CreateDownloadResourceDto, tenantId: string, uploadedById?: string, file?: Express.Multer.File) {
    const resource = new DownloadResource();
    Object.assign(resource, this.normalizeDto(dto, true), { tenantId, uploadedById });

    this.validateVideoRules(resource.resourceType, file, resource.externalUrl);

    if (file) {
      resource.fileUrl = `/uploads/download-center/${file.filename}`;
      resource.mimeType = file.mimetype;
      resource.fileSize = file.size;
    }

    if (resource.resourceType === DownloadResourceType.VIDEO) {
      resource.provider = resource.provider || 'youtube';
    }

    if (!resource.fileUrl && !resource.externalUrl) {
      throw new BadRequestException('Please provide either a file upload or a YouTube/resource URL.');
    }

    return this.resourceRepo.save(resource);
  }

  async findAll(tenantId: string, filters: DownloadResourceFilterDto, user: any) {
    const qb = this.resourceRepo
      .createQueryBuilder('resource')
      .leftJoinAndSelect('resource.class', 'class')
      .leftJoinAndSelect('resource.section', 'section')
      .leftJoinAndSelect('resource.subject', 'subject')
      .leftJoinAndSelect('resource.session', 'session')
      .leftJoinAndSelect('resource.term', 'term')
      .where('resource.tenantId = :tenantId', { tenantId })
      .orderBy('resource.isFeatured', 'DESC')
      .addOrderBy('resource.createdAt', 'DESC');

    this.applyFilters(qb, filters);

    const role = this.getRole(user);
    if (role === 'student') {
      const student = await this.resolveStudent(user, tenantId);
      if (!student) return [];

      qb.andWhere('resource.status = :published', { published: DownloadResourceStatus.PUBLISHED });
      qb.andWhere('resource.visibility IN (:...visibility)', {
        visibility: [DownloadResourceVisibility.ALL, DownloadResourceVisibility.STUDENTS, DownloadResourceVisibility.PUBLIC],
      });
      qb.andWhere(new Brackets((scoped) => {
        scoped.where('resource.classId IS NULL OR resource.classId = :classId', { classId: student.classId || null });
        scoped.andWhere('resource.sectionId IS NULL OR resource.sectionId = :sectionId', { sectionId: student.sectionId || null });
      }));
    } else if (role === 'parent') {
      const studentId = filters.studentId;
      if (!studentId) return [];

      const student = await this.resolveParentStudent(user.id, studentId, tenantId);
      qb.andWhere('resource.status = :published', { published: DownloadResourceStatus.PUBLISHED });
      qb.andWhere('resource.visibility IN (:...visibility)', {
        visibility: [DownloadResourceVisibility.ALL, DownloadResourceVisibility.PARENTS, DownloadResourceVisibility.STUDENTS, DownloadResourceVisibility.PUBLIC],
      });
      qb.andWhere(new Brackets((scoped) => {
        scoped.where('resource.classId IS NULL OR resource.classId = :classId', { classId: student.classId || null });
        scoped.andWhere('resource.sectionId IS NULL OR resource.sectionId = :sectionId', { sectionId: student.sectionId || null });
      }));
    } else if (!this.isStaffRole(role)) {
      throw new ForbiddenException('You do not have permission to view download resources.');
    }

    return qb.getMany();
  }

  async findOne(id: string, tenantId: string, user: any) {
    const resource = await this.resourceRepo.findOne({
      where: { id, tenantId },
      relations: ['class', 'section', 'subject', 'session', 'term'],
    });

    if (!resource) {
      throw new NotFoundException('Resource not found.');
    }

    const role = this.getRole(user);
    if (role === 'student') {
      const student = await this.resolveStudent(user, tenantId);
      if (!this.canAccessAsLearner(resource, student?.classId, student?.sectionId, [DownloadResourceVisibility.ALL, DownloadResourceVisibility.STUDENTS, DownloadResourceVisibility.PUBLIC])) {
        throw new ForbiddenException('You do not have access to this resource.');
      }
    } else if (role === 'parent') {
      const studentId = user.selectedChildId || user.studentId;
      if (!studentId) {
        throw new ForbiddenException('Please select a child to view this resource.');
      }
      const student = await this.resolveParentStudent(user.id, studentId, tenantId);
      if (!this.canAccessAsLearner(resource, student.classId, student.sectionId, [DownloadResourceVisibility.ALL, DownloadResourceVisibility.PARENTS, DownloadResourceVisibility.STUDENTS, DownloadResourceVisibility.PUBLIC])) {
        throw new ForbiddenException('You do not have access to this resource.');
      }
    }

    return resource;
  }

  async update(id: string, dto: UpdateDownloadResourceDto, tenantId: string, file?: Express.Multer.File) {
    const resource = await this.resourceRepo.findOne({ where: { id, tenantId } });
    if (!resource) throw new NotFoundException('Resource not found.');

    Object.assign(resource, this.normalizeDto(dto));
    this.validateVideoRules(resource.resourceType, file, resource.externalUrl);

    if (file) {
      resource.fileUrl = `/uploads/download-center/${file.filename}`;
      resource.mimeType = file.mimetype;
      resource.fileSize = file.size;
    }

    if (resource.resourceType === DownloadResourceType.VIDEO) {
      resource.provider = resource.provider || 'youtube';
    }

    return this.resourceRepo.save(resource);
  }

  async remove(id: string, tenantId: string) {
    const resource = await this.resourceRepo.findOne({ where: { id, tenantId } });
    if (!resource) throw new NotFoundException('Resource not found.');
    await this.resourceRepo.remove(resource);
    return { success: true };
  }

  async incrementView(id: string, tenantId: string) {
    await this.resourceRepo.increment({ id, tenantId }, 'viewCount', 1);
    return { success: true };
  }

  async incrementDownload(id: string, tenantId: string) {
    await this.resourceRepo.increment({ id, tenantId }, 'downloadCount', 1);
    return { success: true };
  }

  private applyFilters(qb: any, filters: DownloadResourceFilterDto) {
    if (filters.search) {
      qb.andWhere('(LOWER(resource.title) LIKE :search OR LOWER(resource.description) LIKE :search)', {
        search: `%${filters.search.toLowerCase()}%`,
      });
    }

    ['resourceType', 'status', 'visibility', 'classId', 'sectionId', 'subjectId', 'sessionId', 'termId'].forEach((key) => {
      const value = filters[key as keyof DownloadResourceFilterDto];
      if (value) {
        qb.andWhere(`resource.${key} = :${key}`, { [key]: value });
      }
    });
  }

  private normalizeDto(dto: CreateDownloadResourceDto | UpdateDownloadResourceDto, withDefaults = false) {
    const normalized: any = { ...dto };

    if (dto.provider || dto.resourceType === DownloadResourceType.VIDEO) {
      normalized.provider = dto.provider || 'youtube';
    }

    if (dto.visibility) {
      normalized.visibility = dto.visibility;
    }

    if (dto.status) {
      normalized.status = dto.status;
    }

    if (dto.isFeatured !== undefined) {
      normalized.isFeatured = dto.isFeatured === 'true';
    }

    return withDefaults
      ? {
          visibility: DownloadResourceVisibility.STUDENTS,
          status: DownloadResourceStatus.DRAFT,
          ...normalized,
        }
      : normalized;
  }

  private getRole(user: any) {
    return (user?.roleObject?.name || user?.role || '').toString().toLowerCase().trim();
  }

  private isStaffRole(role: string) {
    return ['admin', 'administrator', 'super admin', 'super administrator', 'teacher', 'librarian'].includes(role) || role.includes('admin');
  }

  private async resolveStudent(user: any, tenantId: string) {
    const rawId = user.studentId || user.id;
    return this.studentRepo.findOne({
      where: [
        { id: rawId, tenantId },
        { userId: user.id, tenantId },
      ],
    });
  }

  private async resolveParentStudent(parentUserId: string, studentId: string, tenantId: string) {
    const student = await this.studentRepo
      .createQueryBuilder('student')
      .innerJoin('student.parent', 'parent')
      .where('student.id = :studentId', { studentId })
      .andWhere('student.tenantId = :tenantId', { tenantId })
      .andWhere('parent.userId = :parentUserId', { parentUserId })
      .getOne();

    if (!student) {
      throw new ForbiddenException('You can only view resources for your own children.');
    }

    return student;
  }

  private canAccessAsLearner(resource: DownloadResource, classId?: string, sectionId?: string, visibility: DownloadResourceVisibility[] = []) {
    if (resource.status !== DownloadResourceStatus.PUBLISHED) return false;
    if (!visibility.includes(resource.visibility)) return false;
    if (resource.classId && resource.classId !== classId) return false;
    if (resource.sectionId && resource.sectionId !== sectionId) return false;
    return true;
  }

  private validateVideoRules(resourceType: DownloadResourceType, file?: Express.Multer.File, externalUrl?: string) {
    if (file && this.isVideoFile(file)) {
      throw new BadRequestException('Video files cannot be uploaded. Please use a YouTube URL for video tutorials.');
    }

    if (resourceType === DownloadResourceType.VIDEO) {
      if (file) {
        throw new BadRequestException('Video tutorials must use a YouTube URL, not a file upload.');
      }

      if (!externalUrl || !this.isYoutubeUrl(externalUrl)) {
        throw new BadRequestException('Please provide a valid YouTube URL for video tutorials.');
      }
    }
  }

  private isVideoFile(file: Express.Multer.File) {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.flv', '.wmv'];
    return file.mimetype?.startsWith('video/') || videoExtensions.includes(extname(file.originalname).toLowerCase());
  }

  private isYoutubeUrl(url: string) {
    return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url);
  }
}
