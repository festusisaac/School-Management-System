import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobPosting } from '../entities/job-posting.entity';
import { CreateJobPostingDto, UpdateJobPostingDto } from '../dtos/job-posting.dto';

@Injectable()
export class CareerService {
  constructor(
    @InjectRepository(JobPosting)
    private readonly jobRepository: Repository<JobPosting>,
  ) {}

  async create(dto: CreateJobPostingDto, tenantId: string): Promise<JobPosting> {
    const job = this.jobRepository.create({
      ...dto,
      tenantId,
    });
    return this.jobRepository.save(job);
  }

  async findAll(tenantId: string): Promise<JobPosting[]> {
    return this.jobRepository.find({
      where: { tenantId },
      order: { postedDate: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<JobPosting> {
    const job = await this.jobRepository.findOne({ where: { id, tenantId } });
    if (!job) throw new NotFoundException('Job posting not found');
    return job;
  }

  async update(id: string, dto: UpdateJobPostingDto, tenantId: string): Promise<JobPosting> {
    const job = await this.findOne(id, tenantId);
    Object.assign(job, dto);
    return this.jobRepository.save(job);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const job = await this.findOne(id, tenantId);
    await this.jobRepository.remove(job);
  }

  async findPublic(tenantId?: string): Promise<JobPosting[]> {
    let effectiveTenantId = tenantId;

    if (!effectiveTenantId) {
      const firstJob = await this.jobRepository.findOne({ where: {} });
      if (!firstJob) return [];
      effectiveTenantId = firstJob.tenantId;
    }

    return this.jobRepository.find({
      where: { tenantId: effectiveTenantId, status: 'Open' as any },
      order: { postedDate: 'DESC' },
    });
  }
}
