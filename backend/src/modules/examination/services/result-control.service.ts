import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like, MoreThan } from 'typeorm';
import { ScratchCard } from '../entities/scratch-card.entity';
import { ScratchCardBatch } from '../entities/scratch-card-batch.entity';
import { ScratchCardLog } from '../entities/scratch-card-log.entity';
import { StudentTermResult } from '../entities/student-term-result.entity';
import { GenerateScratchCardDto, GetScratchCardsFilterDto, VerifyScratchCardDto } from '../dtos/control/control.dto';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import moment from 'moment';

export interface ScratchCardBatchWithCounts extends ScratchCardBatch {
    usedCards: number;
    totalCards: number;
}

@Injectable()
export class ResultControlService {
    constructor(
        @InjectRepository(ScratchCard)
        private scratchCardRepo: Repository<ScratchCard>,
        @InjectRepository(ScratchCardBatch)
        private batchRepo: Repository<ScratchCardBatch>,
        @InjectRepository(ScratchCardLog)
        private logRepo: Repository<ScratchCardLog>,
        @InjectRepository(StudentTermResult)
        private termResultRepo: Repository<StudentTermResult>,
    ) { }

    async getResultSummary(examGroupId: string, classId: string, tenantId: string) {
        const results = await this.termResultRepo.find({
            where: { examGroupId, classId, tenantId },
            relations: ['student'],
        });

        const total = results.length;
        const drafted = results.filter(r => r.status === 'DRAFT').length;
        const approved = results.filter(r => r.status === 'APPROVED').length;
        const published = results.filter(r => r.status === 'PUBLISHED').length;

        return { total, drafted, approved, published, results };
    }

    async approveResults(examGroupId: string, classId: string, tenantId: string) {
        await this.termResultRepo.update(
            { examGroupId, classId, status: 'DRAFT', tenantId },
            { status: 'APPROVED' }
        );
        return { message: 'Results approved successfully' };
    }

    async publishResults(examGroupId: string, classId: string, tenantId: string) {
        await this.termResultRepo.update(
            { examGroupId, classId, status: 'APPROVED', tenantId },
            { status: 'PUBLISHED' }
        );
        return { message: 'Results published successfully' };
    }

    async generateScratchCards(dto: GenerateScratchCardDto, tenantId: string, userId: string) {
        // Create Batch
        const batchName = dto.batchName || `Batch - ${new Date().toISOString()}`;
        const batch = this.batchRepo.create({
            name: batchName,
            sessionId: dto.sessionId,
            quantity: dto.quantity,
            tenantId,
            createdBy: userId
        });
        const savedBatch = await this.batchRepo.save(batch);

        const cards: ScratchCard[] = [];
        for (let i = 0; i < dto.quantity; i++) {
            const generatedCode = this.generateRandomString(dto.codeLength || 12, dto.codeCharset || 'alnum');
            const code = ((dto.codePrefix || '') + generatedCode + (dto.codeSuffix || '')).toUpperCase();
            const pin = this.generateRandomString(dto.pinLength || 8, dto.pinCharset || 'numeric').toUpperCase();

            const card = this.scratchCardRepo.create({
                code,
                pin,
                value: dto.value || 0,
                maxUsage: dto.maxUsage || 5,
                expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
                batchId: savedBatch.id,
                sessionId: dto.sessionId,
                tenantId,
                status: 'unsold'
            });
            cards.push(card);
        }

        // Use chunked inserts for large quantities
        const chunkSize = 100;
        for (let i = 0; i < cards.length; i += chunkSize) {
            await this.scratchCardRepo.save(cards.slice(i, i + chunkSize));
        }

        return {
            message: `${dto.quantity} scratch cards generated successfully in batch: ${savedBatch.name}`,
            batch: savedBatch,
            count: dto.quantity
        };
    }

    private generateRandomString(length: number, charset: 'alnum' | 'numeric' | 'hex' = 'alnum'): string {
        let chars = '';
        if (charset === 'numeric') chars = '0123456789';
        else if (charset === 'hex') chars = '0123456789ABCDEF';
        else chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        let result = '';
        const bytes = crypto.randomBytes(length);
        for (let i = 0; i < length; i++) {
            result += chars.charAt(bytes[i] % chars.length);
        }
        return result;
    }

    async getScratchCards(filter: GetScratchCardsFilterDto, tenantId: string) {
        const { status, batchId, sessionId, studentId, search, page = 1, limit = 50 } = filter;
        const skip = (page - 1) * limit;

        const query = this.scratchCardRepo.createQueryBuilder('card')
            .leftJoinAndSelect('card.batch', 'batch')
            .leftJoinAndSelect('card.session', 'session')
            .leftJoinAndSelect('card.student', 'student')
            .where('card.tenantId = :tenantId', { tenantId });

        if (status) query.andWhere('card.status = :status', { status });
        if (batchId) query.andWhere('card.batchId = :batchId', { batchId });
        if (sessionId) query.andWhere('card.sessionId = :sessionId', { sessionId });
        if (studentId) query.andWhere('card.studentId = :studentId', { studentId });
        if (search) {
            query.andWhere('(card.code ILIKE :search OR card.pin ILIKE :search)', { search: `%${search}%` });
        }

        const [items, total] = await query
            .orderBy('card.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return { items, total, page, limit };
    }

    async getBatches(tenantId: string): Promise<any[]> {
        const batches = await this.batchRepo.find({
            where: { tenantId },
            order: { createdAt: 'DESC' },
            relations: ['session']
        });

        const counts = await this.scratchCardRepo.createQueryBuilder('card')
            .select('card.batchId', 'batchId')
            .addSelect('COUNT(*)', 'total')
            .addSelect('COUNT(CASE WHEN card.status IN (\'sold\', \'redeemed\') THEN 1 ELSE null END)', 'used')
            .where('card.tenantId = :tenantId', { tenantId })
            .groupBy('card.batchId')
            .getRawMany();

        const countMap = new Map(counts.map(c => [c.batchId, { total: parseInt(c.total), used: parseInt(c.used) }]));

        return batches.map(batch => ({
            ...batch,
            usedCards: countMap.get(batch.id)?.used || 0,
            totalCards: countMap.get(batch.id)?.total || batch.quantity
        }));
    }

    async deleteBatch(id: string, tenantId: string) {
        const batch = await this.batchRepo.findOne({ where: { id, tenantId } });
        if (!batch) throw new NotFoundException('Batch not found');
        
        // Prevent deletion if any cards are sold/redeemed
        const usedCardsCount = await this.scratchCardRepo.count({
            where: { batchId: id, tenantId, status: In(['sold', 'redeemed']) }
        });
        
        if (usedCardsCount > 0) {
            throw new BadRequestException('Cannot delete a batch that contains sold or redeemed cards');
        }

        // Delete all cards in this batch first
        await this.scratchCardRepo.delete({ batchId: id, tenantId });
        
        return this.batchRepo.remove(batch);
    }

    async deleteCard(id: string, tenantId: string) {
        const card = await this.scratchCardRepo.findOne({ where: { id, tenantId } });
        if (!card) throw new NotFoundException('Card not found');
        
        if (card.status === 'sold' || card.status === 'redeemed') {
            throw new BadRequestException('Cannot delete a sold or redeemed card');
        }
        
        return this.scratchCardRepo.remove(card);
    }

    async bulkDeleteCards(ids: string[], tenantId: string) {
        // Find if any of these cards are sold or redeemed
        const usedCardsCount = await this.scratchCardRepo.count({
            where: { id: In(ids), tenantId, status: In(['sold', 'redeemed']) }
        });
        
        if (usedCardsCount > 0) {
            throw new BadRequestException('Cannot delete sold or redeemed cards from the selection');
        }

        return this.scratchCardRepo.delete({ id: In(ids), tenantId });
    }

    async verifyCard(dto: VerifyScratchCardDto, tenantId: string, ip?: string, userAgent?: string) {
        const { code, pin, studentId, sessionId, termId } = dto;

        // 1. Brute Force Protection (Lockout)
        // Check for 5 failed attempts in the last 15 minutes for this IP or Student
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
        const failedAttempts = await this.logRepo.count({
            where: [
                { ipAddress: ip, status: false, createdAt: MoreThan(fifteenMinsAgo), tenantId },
                // Note: studentId check is harder if it's inside JSON, but we can check if studentId is passed in dto
                // For now, IP-based lockout is the most robust against bot nets.
            ]
        });

        if (failedAttempts >= 5) {
            throw new BadRequestException('Too many failed attempts. Please try again in 15 minutes.');
        }

        // 2. Perform verification and redemption in a single transaction
        return this.scratchCardRepo.manager.transaction(async (transactionalEntityManager) => {
            // Fetch card with lock FIRST (to prevent race conditions)
            const card = await transactionalEntityManager.findOne(ScratchCard, {
                where: { code, pin, tenantId },
                lock: { mode: 'pessimistic_write' }
            });

            // Load batch separately if needed (to avoid outer join FOR UPDATE error)
            if (card && card.batchId) {
                card.batch = await transactionalEntityManager.findOne(ScratchCardBatch as any, { where: { id: card.batchId, tenantId } }) as any;
            }

            const logData = {
                action: 'validate',
                details: dto,
                ipAddress: ip,
                userAgent: userAgent,
                tenantId,
                scratchCardId: card?.id,
                status: false // Default to false
            };

            if (!card) {
                await transactionalEntityManager.save(ScratchCardLog, { ...logData, failureReason: 'Invalid scratch card details' });
                throw new BadRequestException('Invalid scratch card details');
            }

            if (card.batch && card.batch.status !== 'active') {
                await transactionalEntityManager.save(ScratchCardLog, { ...logData, failureReason: 'Card belongs to an inactive batch' });
                throw new BadRequestException('This card belongs to an inactive batch');
            }

            if (card.sessionId && card.sessionId !== sessionId) {
                await transactionalEntityManager.save(ScratchCardLog, { ...logData, failureReason: 'Card belongs to a different session' });
                throw new BadRequestException('This card is not valid for the current session');
            }

            if (card.expiryDate && new Date(card.expiryDate) < new Date()) {
                await transactionalEntityManager.save(ScratchCardLog, { ...logData, failureReason: 'Card expired' });
                throw new BadRequestException('Card expired');
            }

            if (card.usageCount >= card.maxUsage) {
                await transactionalEntityManager.save(ScratchCardLog, { ...logData, failureReason: 'Max usage exceeded' });
                throw new BadRequestException('This card has exceeded its usage limit');
            }

            // If card was already used for a different student/term/session
            if (card.usageCount > 0) {
                if (card.studentId !== studentId || (termId && card.termId !== termId) || (card.sessionId && card.sessionId !== sessionId)) {
                    await transactionalEntityManager.save(ScratchCardLog, { ...logData, failureReason: 'Card used for different student/term' });
                    throw new BadRequestException('Card already used for another student or for another term');
                }
            } else {
                // First time use: bind to student and term
                card.studentId = studentId;
                card.termId = termId || null as any;
                card.status = 'redeemed';
            }

            card.usageCount += 1;
            
            await transactionalEntityManager.save(card);
            await transactionalEntityManager.save(ScratchCardLog, { ...logData, status: true });

            return { valid: true, card };
        });
    }

    async sellCard(id: string, tenantId: string, userId: string) {
        const card = await this.scratchCardRepo.findOne({ where: { id, tenantId }, relations: ['batch'] });
        if (!card) throw new NotFoundException('Card not found');

        if (card.batch && card.batch.status !== 'active') {
            throw new BadRequestException('This card belongs to an inactive batch and cannot be sold');
        }

        if (card.status !== 'unsold') {
            throw new BadRequestException('This card cannot be sold');
        }

        card.status = 'sold';
        // metadata can store who sold it
        card.metadata = { ...(card.metadata || {}), soldBy: userId, soldAt: new Date() };

        return this.scratchCardRepo.save(card);
    }

    async getDashboardStats(tenantId: string) {
        const totalGenerated = await this.scratchCardRepo.count({ where: { tenantId } });
        const totalDistributed = await this.scratchCardRepo.count({ 
            where: { tenantId, status: In(['sold', 'redeemed']) } 
        });
        const totalRedeemed = await this.scratchCardRepo.count({ 
            where: { tenantId, status: 'redeemed' } 
        });
        
        // Logs stats
        const totalChecked = await this.logRepo.count({ where: { tenantId, action: 'validate' } });
        const successCount = await this.logRepo.count({ where: { tenantId, action: 'validate', status: true } });
        const failCount = await this.logRepo.count({ where: { tenantId, action: 'validate', status: false } });

        // overallWinRate: % of generated cards that were redeemed
        const overallWinRate = totalGenerated > 0 ? (totalRedeemed / totalGenerated) * 100 : 0;

        // 7-day trend
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const trendLogs = await this.logRepo.createQueryBuilder('log')
            .select("DATE(log.createdAt)", "date")
            .addSelect("COUNT(*)", "count")
            .where("log.tenantId = :tenantId", { tenantId })
            .andWhere("log.action = :action", { action: 'validate' })
            .andWhere("log.createdAt >= :sevenDaysAgo", { sevenDaysAgo })
            .groupBy("DATE(log.createdAt)")
            .orderBy("DATE(log.createdAt)", "ASC")
            .getRawMany();

        // Recent Audit logs
        const recentLogs = await this.logRepo.find({
            where: { tenantId },
            order: { createdAt: 'DESC' },
            take: 10
        });

        // Suspicious Activity: multiple failures from same IP or details
        const suspiciousActivities = await this.logRepo.find({
            where: { tenantId, status: false },
            order: { createdAt: 'DESC' },
            take: 5
        });

        return {
            totalGenerated,
            totalDistributed,
            totalChecked,
            totalRedeemed,
            overallWinRate,
            successCount,
            failCount,
            trendData: trendLogs.map(l => ({
                date: moment(l.date).format('MMM dd'),
                count: parseInt(l.count)
            })),
            recentLogs: recentLogs.map(l => ({
                action: l.action,
                status: l.status ? 'Success' : 'Failed',
                reason: l.failureReason,
                ip: l.ipAddress,
                time: moment(l.createdAt).format('MMM dd, HH:mm')
            })),
            suspiciousActivities: suspiciousActivities.map(l => ({
                severity: 'medium',
                message: l.failureReason || 'Validation failed',
                time: moment(l.createdAt).fromNow()
            }))
        };
    }
}
