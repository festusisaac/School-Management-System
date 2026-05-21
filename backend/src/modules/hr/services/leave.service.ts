import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, EntityManager } from 'typeorm';
import { LeaveType } from '../entities/leave-type.entity';
import { LeaveRequest, LeaveStatus } from '../entities/leave-request.entity';
import { LeaveApproval, ApprovalAction } from '../entities/leave-approval.entity';
import { CreateLeaveTypeDto, UpdateLeaveTypeDto, CreateLeaveRequestDto } from '../dto/leave.dto';
import { EmailService } from '@modules/internal-communication/email.service';
import { User } from '@modules/auth/entities/user.entity';

@Injectable()
export class LeaveService {
    constructor(
        @InjectRepository(LeaveType)
        private leaveTypeRepository: Repository<LeaveType>,
        @InjectRepository(LeaveRequest)
        private leaveRequestRepository: Repository<LeaveRequest>,
        @InjectRepository(LeaveApproval)
        private leaveApprovalRepository: Repository<LeaveApproval>,
        private readonly entityManager: EntityManager,
        private readonly emailService: EmailService,
    ) { }

    // Leave Types
    async createLeaveType(dto: CreateLeaveTypeDto): Promise<LeaveType> {
        return this.leaveTypeRepository.save({
            ...dto,
            maxDaysPerYear: dto.maxDays
        } as any);
    }

    async getLeaveTypes(): Promise<LeaveType[]> {
        return this.leaveTypeRepository.find({ where: { isActive: true } });
    }

    async updateLeaveType(id: string, dto: UpdateLeaveTypeDto): Promise<LeaveType> {
        const leaveType = await this.leaveTypeRepository.findOne({ where: { id } });
        if (!leaveType) throw new NotFoundException('Leave type not found');

        Object.assign(leaveType, {
            ...dto,
            maxDaysPerYear: dto.maxDays
        });

        return this.leaveTypeRepository.save(leaveType);
    }

    async deleteLeaveType(id: string): Promise<void> {
        await this.leaveTypeRepository.update(id, { isActive: false });
    }

    // Leave Requests
    async createLeaveRequest(staffId: string, dto: CreateLeaveRequestDto, file?: Express.Multer.File): Promise<LeaveRequest> {
        const start = new Date(dto.startDate);
        const end = new Date(dto.endDate);

        if (start > end) throw new BadRequestException('Start date cannot be after end date');

        // Calculate days (simple difference)
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // Fetch leave type to get max days
        const leaveType = await this.leaveTypeRepository.findOne({ where: { id: dto.leaveTypeId } });
        if (!leaveType) throw new NotFoundException('Leave type not found');

        // Calculate current usage (Approved + Pending)
        const allStaffRequests = await this.leaveRequestRepository.find({ where: { staffId, leaveTypeId: dto.leaveTypeId } });
        const usedDays = allStaffRequests
            .filter(r => r.status === LeaveStatus.APPROVED || r.status === LeaveStatus.PENDING)
            .reduce((sum, r) => sum + r.numberOfDays, 0);

        if (usedDays + numberOfDays > leaveType.maxDaysPerYear) {
            const remaining = Math.max(0, leaveType.maxDaysPerYear - usedDays);
            throw new BadRequestException(
                `Leave limit exceeded for ${leaveType.name}. ` +
                `You have ${remaining} days remaining (including pending requests), but you requested ${numberOfDays} days.`
            );
        }

        const request = this.leaveRequestRepository.create({
            staffId,
            leaveTypeId: dto.leaveTypeId,
            startDate: start,
            endDate: end,
            reason: dto.reason,
            numberOfDays,
            status: LeaveStatus.PENDING,
            supportingDocument: file ? `/uploads/leaves/${file.filename}` : undefined
        });

        const savedRequest = await this.leaveRequestRepository.save(request);

        try {
            // Load staff details and leave type details to enrich notification
            const fullRequest = await this.leaveRequestRepository.findOne({
                where: { id: savedRequest.id },
                relations: ['staff', 'leaveType']
            });

            if (fullRequest && fullRequest.staff) {
                const tenantId = fullRequest.staff.tenantId;

                // Find active super administrators for the same tenant
                const superAdmins = await this.entityManager.find(User, {
                    where: {
                        role: 'super administrator',
                        tenantId,
                        isActive: true
                    }
                });

                // Send notification email to each super administrator
                for (const admin of superAdmins) {
                    await this.emailService.sendNotificationEmail(
                        admin.email,
                        `New Leave Request: ${fullRequest.staff.firstName} ${fullRequest.staff.lastName}`,
                        `A new leave application has been submitted by teacher/staff <strong>${fullRequest.staff.firstName} ${fullRequest.staff.lastName}</strong>.<br/><br/>` +
                            `<strong>Leave Type:</strong> ${fullRequest.leaveType?.name || 'N/A'}<br/>` +
                            `<strong>Duration:</strong> ${fullRequest.numberOfDays} day(s) (${dto.startDate} to ${dto.endDate})<br/>` +
                            `<strong>Reason:</strong> ${fullRequest.reason}<br/><br/>` +
                            `Please login to the portal to review and approve/reject this request.`,
                        'Leave Application Submitted'
                    );
                }
            }
        } catch (error) {
            // Log the error but do not block leave application creation if email fails
            console.error('Failed to send leave application notification email:', error);
        }

        return savedRequest;
    }

    async getStaffLeaveRequests(staffId: string): Promise<LeaveRequest[]> {
        return this.leaveRequestRepository.find({
            where: { staffId },
            relations: ['leaveType'],
            order: { createdAt: 'DESC' }
        });
    }

    async getAllLeaveRequests(): Promise<LeaveRequest[]> {
        return this.leaveRequestRepository.find({
            relations: ['staff', 'leaveType'],
            order: { createdAt: 'DESC' }
        });
    }

    async approveLeave(id: string, approverId: string | null, status: 'Approved' | 'Rejected', comment?: string, adminName?: string): Promise<LeaveRequest> {
        const request = await this.leaveRequestRepository.findOne({ where: { id } });
        if (!request) throw new NotFoundException('Leave request not found');

        request.status = status === 'Approved' ? LeaveStatus.APPROVED : LeaveStatus.REJECTED;

        const approval = this.leaveApprovalRepository.create({
            leaveRequestId: id,
            approverId: approverId || undefined,
            adminApproverName: adminName,
            action: status === 'Approved' ? ApprovalAction.APPROVED : ApprovalAction.REJECTED,
            comments: comment || '',
            approvalLevel: 1, // Default to level 1 for now
            actionDate: new Date()
        });

        await this.leaveApprovalRepository.save(approval);
        return this.leaveRequestRepository.save(request);
    }

    async getLeaveBalance(staffId: string) {
        const leaveTypes = await this.getLeaveTypes();
        const usedRequests = await this.leaveRequestRepository.find({
            where: {
                staffId,
                status: In([LeaveStatus.APPROVED, LeaveStatus.PENDING])
            }
        });

        const balance = leaveTypes.map(type => {
            const used = usedRequests
                .filter(req => req.leaveTypeId === type.id)
                .reduce((sum, req) => sum + req.numberOfDays, 0);

            return {
                leaveType: type.name,
                maxDays: type.maxDaysPerYear,
                used,
                available: Math.max(0, type.maxDaysPerYear - used)
            };
        });

        const totalAvailable = balance.reduce((sum, b) => sum + b.available, 0);

        return {
            totalAvailable,
            details: balance
        };
    }
}
