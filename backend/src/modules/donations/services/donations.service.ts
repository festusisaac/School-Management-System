import { Injectable, NotFoundException, BadRequestException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DonationProject, Donation } from '../entities/donation.entity';
import { CreateDonationProjectDto, UpdateDonationProjectDto, InitiateDonationDto, VerifyDonationDto } from '../dtos/donations.dto';
import { AlumniService } from '../../alumni/services/alumni.service';
import axios from 'axios';

@Injectable()
export class DonationsService {
  constructor(
    @InjectRepository(DonationProject)
    private projectRepository: Repository<DonationProject>,
    @InjectRepository(Donation)
    private donationRepository: Repository<Donation>,
    @Inject(forwardRef(() => AlumniService))
    private alumniService: AlumniService,
  ) { }

  // --- Projects (Admin & Public) ---

  async createProject(dto: CreateDonationProjectDto, tenantId: string): Promise<DonationProject> {
    const project = this.projectRepository.create({
      ...dto,
      tenantId,
    });
    return this.projectRepository.save(project);
  }

  async updateProject(id: string, dto: UpdateDonationProjectDto, tenantId: string): Promise<DonationProject> {
    const project = await this.projectRepository.findOne({ where: { id, tenantId } });
    if (!project) throw new NotFoundException('Project not found');
    Object.assign(project, dto);
    return this.projectRepository.save(project);
  }

  async findAllProjects(tenantId: string, publicOnly = false): Promise<DonationProject[]> {
    const where: any = { tenantId };
    if (publicOnly) {
      where.status = 'active';
    }
    return this.projectRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOneProject(id: string, tenantId: string): Promise<DonationProject> {
    const project = await this.projectRepository.findOne({ where: { id, tenantId } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async removeProject(id: string, tenantId: string): Promise<void> {
    const project = await this.findOneProject(id, tenantId);
    await this.projectRepository.remove(project);
  }

  // --- Donations ---

  async initiateDonation(dto: InitiateDonationDto, tenantId: string) {
    // Check if project exists if provided
    if (dto.projectId) {
      const project = await this.projectRepository.findOne({ where: { id: dto.projectId, tenantId } });
      if (!project || project.status !== 'active') {
        throw new BadRequestException('Invalid or inactive project');
      }
    }

    // We don't save the donation yet, we return the metadata for the frontend
    // The donation will be created upon verification
    return {
      amount: dto.amount,
      email: dto.donorEmail,
      metadata: {
        donorName: dto.donorName,
        donorEmail: dto.donorEmail,
        projectId: dto.projectId,
        tenantId,
      }
    };
  }

  async verifyDonation(dto: VerifyDonationDto, tenantId: string) {
    const { reference, gateway } = dto;

    // Concurrency protection
    return this.donationRepository.manager.transaction(async (manager) => {
      // Advisory lock to prevent duplicate processing
      await manager.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [reference]);

      const existing = await manager.findOne(Donation, { where: { paymentReference: reference, tenantId } });
      if (existing) return existing;

      let amountPaid = 0;
      let metadata: any = {};

      try {
        if (gateway === 'paystack') {
          const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
            timeout: 10000, // 10s timeout
          });

          if (!response.data.status || response.data.data.status !== 'success') {
            throw new BadRequestException('Paystack verification failed');
          }

          amountPaid = response.data.data.amount / 100;
          metadata = response.data.data.metadata;
        } else if (gateway === 'flutterwave') {
          const response = await axios.get(`https://api.flutterwave.com/v3/transactions/${reference}/verify`, {
            headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` },
            timeout: 10000, // 10s timeout
          });

          if (response.data.status !== 'success' || response.data.data.status !== 'successful') {
            throw new BadRequestException('Flutterwave verification failed');
          }

          amountPaid = response.data.data.amount;
          metadata = response.data.data.meta;
        }

        // Handle stringified metadata if necessary
        if (typeof metadata === 'string') {
          try {
            metadata = JSON.parse(metadata);
          } catch (e) {
            console.error('Failed to parse metadata string:', metadata);
            metadata = {};
          }
        }
      } catch (error: any) {
        console.error(`Verification error for ref ${reference}:`, error.message);
        if (error.code === 'ECONNABORTED') {
          throw new BadRequestException('Payment verification timed out. Please refresh to try again.');
        }
        throw new BadRequestException(error.response?.data?.message || 'Payment verification failed');
      }

      // Check if donor is an alumnus by email
      const alumni = await this.alumniService.findByEmail(metadata.donorEmail, tenantId);

      const donation = manager.create(Donation, {
        amount: amountPaid,
        donorName: metadata.donorName,
        donorEmail: metadata.donorEmail,
        alumniId: alumni?.id,
        projectId: metadata.projectId,
        paymentReference: reference,
        paymentGateway: gateway,
        status: 'success',
        tenantId,
      });

      const savedDonation = await manager.save(donation);

      // Update project progress if applicable
      if (metadata.projectId) {
        await manager.increment(DonationProject, { id: metadata.projectId }, 'currentAmount', amountPaid);

        // Auto-complete project if goal reached? (Optional, maybe admin should do it)
        const project = await manager.findOne(DonationProject, { where: { id: metadata.projectId } });
        if (project && Number(project.currentAmount) >= Number(project.goalAmount)) {
          // You could notify admin here
        }
      }

      return savedDonation;
    });
  }

  async getDonationHistory(tenantId: string): Promise<Donation[]> {
    return this.donationRepository.find({
      where: { tenantId, status: 'success' },
      relations: ['project', 'alumni'],
      order: { createdAt: 'DESC' },
    });
  }

  async getImpactStats(tenantId: string) {
    const totalRaised = await this.donationRepository
      .createQueryBuilder('d')
      .where('d.tenantId = :tenantId AND d.status = :status', { tenantId, status: 'success' })
      .select('SUM(d.amount)', 'total')
      .getRawOne();

    const donorCount = await this.donationRepository
      .createQueryBuilder('d')
      .where('d.tenantId = :tenantId AND d.status = :status', { tenantId, status: 'success' })
      .select('COUNT(DISTINCT d.donorEmail)', 'count')
      .getRawOne();

    return {
      totalRaised: parseFloat(totalRaised?.total || 0),
      donorCount: parseInt(donorCount?.count || 0),
    };
  }
}
