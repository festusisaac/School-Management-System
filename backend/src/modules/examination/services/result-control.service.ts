import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import { ScratchCard } from '../entities/scratch-card.entity';
import { ScratchCardBatch } from '../entities/scratch-card-batch.entity';
import { ScratchCardLog } from '../entities/scratch-card-log.entity';
import { StudentTermResult } from '../entities/student-term-result.entity';
import { GenerateScratchCardDto, GetScratchCardsFilterDto, VerifyScratchCardDto } from '../dtos/control/control.dto';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

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
        const { status, batchId, sessionId, search, page = 1, limit = 50 } = filter;
        const skip = (page - 1) * limit;

        const query = this.scratchCardRepo.createQueryBuilder('card')
            .leftJoinAndSelect('card.batch', 'batch')
            .leftJoinAndSelect('card.session', 'session')
            .leftJoinAndSelect('card.student', 'student')
            .where('card.tenantId = :tenantId', { tenantId });

        if (status) query.andWhere('card.status = :status', { status });
        if (batchId) query.andWhere('card.batchId = :batchId', { batchId });
        if (sessionId) query.andWhere('card.sessionId = :sessionId', { sessionId });
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

    async getBatches(tenantId: string) {
        return this.batchRepo.find({
            where: { tenantId },
            order: { createdAt: 'DESC' },
            relations: ['session']
        });
    }

    async deleteCard(id: string, tenantId: string) {
        const card = await this.scratchCardRepo.findOne({ where: { id, tenantId } });
        if (!card) throw new NotFoundException('Card not found');
        return this.scratchCardRepo.remove(card);
    }

    async bulkDeleteCards(ids: string[], tenantId: string) {
        return this.scratchCardRepo.delete({ id: In(ids), tenantId });
    }

    async verifyCard(dto: VerifyScratchCardDto, tenantId: string, ip?: string, userAgent?: string) {
        const { code, pin, studentId, sessionId, termId } = dto;

        const card = await this.scratchCardRepo.findOne({
            where: { code, pin, tenantId },
            relations: ['batch']
        });

        const logData = {
            action: 'validate',
            details: dto,
            ipAddress: ip,
            userAgent: userAgent,
            tenantId,
            scratchCardId: card?.id
        };

        if (!card) {
            await this.logRepo.save({ ...logData, status: false, failureReason: 'Invalid scratch card details' });
            throw new BadRequestException('Invalid scratch card details');
        }

        if (card.batch && card.batch.status !== 'active') {
            await this.logRepo.save({ ...logData, status: false, failureReason: 'Card belongs to an inactive batch' });
            throw new BadRequestException('This card belongs to an inactive batch');
        }

        if (card.sessionId && card.sessionId !== sessionId) {
            await this.logRepo.save({ ...logData, status: false, failureReason: 'Card belongs to a different session' });
            throw new BadRequestException('This card is not valid for the current session');
        }

        if (card.expiryDate && new Date(card.expiryDate) < new Date()) {
            await this.logRepo.save({ ...logData, status: false, failureReason: 'Card expired' });
            throw new BadRequestException('Card expired');
        }

        if (card.usageCount >= card.maxUsage) {
            await this.logRepo.save({ ...logData, status: false, failureReason: 'Max usage exceeded' });
            throw new BadRequestException('This card has exceeded its usage limit');
        }

        // If card was already used for a different student/term/session
        if (card.usageCount > 0) {
            if (card.studentId !== studentId || card.termId !== termId || card.sessionId !== sessionId) {
                await this.logRepo.save({ ...logData, status: false, failureReason: 'Card used for different student/term' });
                throw new BadRequestException('Card already used for another student or for another term');
            }
        } else {
            // First time use: bind to student and term
            card.studentId = studentId;
            card.termId = termId;
            card.status = 'redeemed';
        }

        card.usageCount += 1;
        await this.scratchCardRepo.save(card);
        await this.logRepo.save({ ...logData, status: true });

        return { valid: true, card };
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
}
