import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScratchCard } from '../entities/scratch-card.entity';
import { StudentTermResult } from '../entities/student-term-result.entity';
import { GenerateScratchCardDto } from '../dtos/control/control.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ResultControlService {
    constructor(
        @InjectRepository(ScratchCard)
        private scratchCardRepo: Repository<ScratchCard>,
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


    async generateScratchCards(dto: GenerateScratchCardDto, tenantId: string) {
        const cards: ScratchCard[] = [];
        for (let i = 0; i < dto.count; i++) {
            // Simple generation logic - in production use secure random
            const serial = `SC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const pin = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // 10 digit pin

            const card = this.scratchCardRepo.create({
                serialNumber: serial,
                pin: pin,
                maxUsage: dto.maxUsage || 5,
                tenantId
            });
            cards.push(card);
        }
        return this.scratchCardRepo.save(cards);
    }

    async verifyCard(pin: string, tenantId: string) {
        const card = await this.scratchCardRepo.findOne({ where: { pin, tenantId } });
        if (!card) return { valid: false, message: 'Invalid Card' };
        if (card.status !== 'ACTIVE') return { valid: false, message: 'Card not active' };
        if (card.usageCount >= card.maxUsage) return { valid: false, message: 'Card usage limit exceeded' };

        // Increment usage
        card.usageCount += 1;
        if (card.usageCount >= card.maxUsage) card.status = 'USED'; // Or keep ACTIVE until fully used?
        await this.scratchCardRepo.save(card);

        return { valid: true };
    }
}
