import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, Between, In, Brackets } from 'typeorm';
import { extname } from 'path';
import { Student } from '../entities/student.entity';
import { CreateStudentDto } from '../dtos/create-student.dto';
import { UpdateStudentDto } from '../dtos/update-student.dto';
import { StudentCategory } from '../entities/student-category.entity';
import { StudentHouse } from '../entities/student-house.entity';
import { DeactivateReason } from '../entities/deactivate-reason.entity';
import { CreateStudentCategoryDto } from '../dtos/student-category.dto';
import { CreateStudentHouseDto } from '../dtos/student-house.dto';
import { CreateDeactivateReasonDto } from '../dtos/deactivate-reason.dto';
import { CreateOnlineAdmissionDto } from '../dtos/create-online-admission.dto';
import { UpdateOnlineAdmissionStatusDto } from '../dtos/update-online-admission-status.dto';
import { OnlineAdmission } from '../entities/online-admission.entity';
import { Parent } from '../entities/parent.entity';
import { StudentDocument } from '../entities/student-document.entity';
import { FeesService } from '../../finance/services/fees.service';
import { UsersService } from '../../system/services/users.service';
import { Role } from '../../auth/entities/role.entity';
import { EmailService } from '../../internal-communication/email.service';
import { SmsService } from '../../internal-communication/sms.service';
import { StudentAttendance } from '../entities/student-attendance.entity';
import { MarkAttendanceDto, BulkMarkAttendanceDto } from '../dtos/student-attendance.dto';
import { SystemSettingsService } from '../../system/services/system-settings.service';
import { MessageTemplatesService } from '../../communication/services/message-templates.service';

@Injectable()
export class StudentsService {
    constructor(
        @InjectRepository(Student)
        private studentsRepository: Repository<Student>,
        @InjectRepository(Parent)
        private parentRepository: Repository<Parent>,
        @InjectRepository(StudentDocument)
        private documentRepository: Repository<StudentDocument>,
        @InjectRepository(StudentCategory)
        private categoryRepository: Repository<StudentCategory>,
        @InjectRepository(StudentHouse)
        private houseRepository: Repository<StudentHouse>,
        @InjectRepository(DeactivateReason)
        private deactivateReasonRepository: Repository<DeactivateReason>,
        @InjectRepository(OnlineAdmission)
        private onlineAdmissionRepository: Repository<OnlineAdmission>,
        @InjectRepository(Role)
        private roleRepository: Repository<Role>,
        @InjectRepository(StudentAttendance)
        private attendanceRepo: Repository<StudentAttendance>,
        private smsService: SmsService,
        private systemSettingsService: SystemSettingsService,
        private feesService: FeesService,
        private usersService: UsersService,
        private emailService: EmailService,
        private messageTemplatesService: MessageTemplatesService,
    ) { }

    // --- Online Admission Payment ---

    async verifyAdmissionPayment(reference: string, email: string, tenantId: string): Promise<{ success: boolean; data?: any }> {
        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        if (!secretKey) {
            throw new Error('PAYSTACK_SECRET_KEY not configured on server');
        }

        try {
            // 1. Verify with Paystack
            const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
                headers: {
                    Authorization: `Bearer ${secretKey}`,
                },
            });

            const data = response.data;
            if (!data.status || data.data.status !== 'success') {
                throw new BadRequestException('Payment verification failed or was unsuccessful');
            }

            // 2. Security Check: Email must match
            if (data.data.customer.email.toLowerCase() !== email.toLowerCase()) {
                throw new BadRequestException('Payment was made with a different email address');
            }

            // 3. Check if reference already used for a successful admission
            const existing = await this.onlineAdmissionRepository.findOne({
                where: { transactionReference: reference }
            });
            if (existing) {
                throw new ConflictException('This payment reference has already been used for an application');
            }

            return { success: true, data: data.data };
        } catch (error: any) {
            console.error('Paystack Verification Error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });

            if (error.response) {
                throw new BadRequestException(error.response.data?.message || 'Payment verification failed');
            }
            throw new BadRequestException(error.message || 'Internal payment verification error');
        }
    }

    // --- Students ---

    async create(createStudentDto: CreateStudentDto, tenantId: string, documentFiles?: Express.Multer.File[]): Promise<Student> {
        let parent: Parent | null = null;

        // 1. Check for Sibling or Parent Link
        if (createStudentDto.parentId) {
            parent = await this.parentRepository.findOne({
                where: { id: createStudentDto.parentId, tenantId }
            });
        } else if (createStudentDto.siblingId) {
            const sibling = await this.studentsRepository.findOne({
                where: { id: createStudentDto.siblingId, tenantId },
                relations: ['parent']
            });
            if (sibling && sibling.parent) {
                parent = sibling.parent;
            }
        }

        // 2. If no parent found/linked, create new one
        if (!parent) {
            const parentData = this.parentRepository.create({
                fatherName: createStudentDto.fatherName,
                fatherPhone: createStudentDto.fatherPhone,
                fatherOccupation: createStudentDto.fatherOccupation,
                motherName: createStudentDto.motherName,
                motherPhone: createStudentDto.motherPhone,
                motherOccupation: createStudentDto.motherOccupation,
                guardianName: createStudentDto.guardianName,
                guardianRelation: createStudentDto.guardianRelation,
                guardianPhone: createStudentDto.guardianPhone,
                guardianEmail: createStudentDto.guardianEmail,
                guardianAddress: createStudentDto.guardianAddress,
                emergencyContact: createStudentDto.emergencyContact,
                tenantId: tenantId,
            });
            parent = await this.parentRepository.save(parentData);
        }

        // 3. Create Student with Parent Link
        let { feeGroupIds, session, documentTitles, feeExclusions, mustChangePassword, ...studentData } = createStudentDto;

        // Clean UUID fields (convert "" to null)
        const uuidFields = ['classId', 'sectionId', 'categoryId', 'houseId', 'deactivateReasonId', 'discountProfileId', 'parentId'];
        uuidFields.forEach(field => {
            if ((studentData as any)[field] === '') {
                (studentData as any)[field] = null;
            }
        });

        // Handle FormData JSON strings
        if (typeof feeGroupIds === 'string') {
            try { feeGroupIds = JSON.parse(feeGroupIds); } catch (e) { }
        }
        if (typeof feeExclusions === 'string') {
            try { feeExclusions = JSON.parse(feeExclusions); } catch (e) { }
        }
        const student = this.studentsRepository.create({
            ...studentData,
            parent: parent,
            tenantId: tenantId
        } as any);
        const savedStudent = await this.studentsRepository.save(student) as any as Student;

        // 4. Save Documents if any
        if (documentFiles && documentFiles.length > 0) {
            let titles: string[] = [];
            if (documentTitles) {
                titles = typeof documentTitles === 'string'
                    ? JSON.parse(documentTitles)
                    : documentTitles;
            }

            const docs = documentFiles.map((file, index) => {
                return this.documentRepository.create({
                    title: titles[index] || file.originalname,
                    filePath: file.path,
                    fileType: extname(file.originalname).substring(1),
                    studentId: savedStudent.id,
                    tenantId: tenantId
                });
            });
            await this.documentRepository.save(docs);
        }

        // --- Simplified Fee Allocation for MVP ---
        if (feeGroupIds && Array.isArray(feeGroupIds) && feeGroupIds.length > 0) {
            await this.feesService.assignFeesToStudent(savedStudent.id, feeGroupIds, tenantId, feeExclusions);
        }

        // 5. Automated User Creation
        try {
            const studentRole = await this.roleRepository.findOne({ where: { name: 'Student' } });
            const parentRole = await this.roleRepository.findOne({ where: { name: 'Parent' } });

            // Create Student User (Prioritize email, fallback to admission no)
            const studentEmail = savedStudent.email || `${savedStudent.admissionNo.toLowerCase()}@student.sms`;
            const studentTempPassword = `Student@${savedStudent.admissionNo.split('/').pop()}`;
            
            const studentUser = await this.usersService.findOrCreateUser(studentEmail, {
                firstName: savedStudent.firstName,
                lastName: savedStudent.lastName || '',
                password: studentTempPassword,
                role: 'student',
                roleId: studentRole?.id,
                tenantId: tenantId,
                photo: savedStudent.studentPhoto,
                mustChangePassword: mustChangePassword // Pass the security flag
            });
            await this.studentsRepository.update(savedStudent.id, { userId: studentUser.id });

            // Create Parent User (Prioritize guardian email, fallback to phone)
            const parentEmail = parent?.guardianEmail || (parent?.guardianPhone ? `${parent.guardianPhone.replace(/\s+/g, '')}@parent.sms` : null);
            
            if (parent && parentEmail && !parent.userId) {
                const parentUser = await this.usersService.findOrCreateUser(parentEmail, {
                    firstName: parent.guardianName || parent.fatherName || 'Parent',
                    lastName: '',
                    password: `Parent@${parent.guardianPhone?.slice(-4) || '1234'}`,
                    role: 'parent',
                    roleId: parentRole?.id,
                    tenantId: tenantId
                });
                await this.parentRepository.update(parent.id, { userId: parentUser.id });
                
                // Send Parent Welcome Email
                await this.emailService.sendAdmissionWelcomeEmail(
                    parentUser.email,
                    parentUser.firstName,
                    parentUser.email,
                    `Parent@${parent.guardianPhone?.slice(-4) || '1234'}`,
                    'Parent'
                );
            }

            // Send Student Welcome Email
            await this.emailService.sendAdmissionWelcomeEmail(
                studentUser.email,
                studentUser.firstName,
                studentUser.email,
                studentTempPassword,
                'Student'
            );
        } catch (error) {
            console.error('Failed to auto-provision user accounts or send welcome emails:', error);
        }

        return savedStudent;
    }

    async findAll(query: any, tenantId: string): Promise<Student[]> {
        const where: any[] = [];
        const baseWhere: any = { isActive: true, tenantId };

        if (query.classId && query.classId !== 'undefined' && query.classId !== '') {
            baseWhere.classId = query.classId;
        }

        // Add support for multiple classIds (for teacher scoping)
        if (query.classIds && Array.isArray(query.classIds) && query.classIds.length > 0) {
            baseWhere.classId = In(query.classIds);
        }
        if (query.sectionId && query.sectionId !== 'undefined' && query.sectionId !== '') {
            baseWhere.sectionId = query.sectionId;
        }
        if (query.parentId && query.parentId !== 'undefined' && query.parentId !== '') {
            baseWhere.parentId = query.parentId;
        }
        if (query.schoolSectionId && query.schoolSectionId !== 'undefined' && query.schoolSectionId !== '') {
            baseWhere.class = { schoolSectionId: query.schoolSectionId };
        }

        if (query.keyword && query.keyword.trim() !== '') {
            const keyword = `%${query.keyword.trim()}%`;
            where.push(
                { ...baseWhere, firstName: ILike(keyword) },
                { ...baseWhere, lastName: ILike(keyword) },
                { ...baseWhere, admissionNo: ILike(keyword) },
                { ...baseWhere, fatherName: ILike(keyword) },
                { ...baseWhere, motherName: ILike(keyword) },
                { ...baseWhere, guardianName: ILike(keyword) },
            );
        } else {
            where.push(baseWhere);
        }

        const results = await this.studentsRepository.find({
            where,
            relations: ['class', 'section', 'category', 'house', 'parent', 'parent.students', 'parent.students.class', 'documents'],
            order: { firstName: 'ASC' },
        });

        return results;
    }

    async findDeactivatedStudents(tenantId: string): Promise<Student[]> {
        return this.studentsRepository.find({
            where: { isActive: false, tenantId },
            relations: ['class', 'section', 'deactivateReason'],
            order: { deactivatedAt: 'DESC' },
        });
    }

    async findOne(id: string, tenantId: string): Promise<Student & { feeGroupIds?: string[] }> {
        const student = await this.studentsRepository.findOne({
            where: [
                { id, tenantId },
                { userId: id, tenantId }
            ],
            relations: ['class', 'section', 'category', 'house', 'deactivateReason', 'parent', 'parent.students', 'parent.students.class', 'documents'],
        });
        if (!student) throw new NotFoundException(`Student with ID ${id} not found`);

        // Fetch Fee Assignments
        const assignments = await this.feesService.getAssignmentsByStudent(student.id, tenantId);
        (student as any).feeGroupIds = assignments.map((a: any) => a.feeGroupId);

        // Return exclusions as well
        const exclusions: Record<string, string[]> = {};
        assignments.forEach((a: any) => {
            if (a.excludedHeadIds) {
                exclusions[a.feeGroupId] = a.excludedHeadIds;
            }
        });
        (student as any).feeExclusions = exclusions;

        return student;
    }

    async update(id: string, updateStudentDto: UpdateStudentDto, tenantId: string, documentFiles?: Express.Multer.File[]): Promise<Student> {
        // 1. Fetch the existing student with all relations
        const student = await this.findOne(id, tenantId);

        console.log(`=== BACKEND UPDATE START [ID: ${id}] ===`);

        // Destructure metadata out
        let { documentTitles, siblingId, feeGroupIds, feeExclusions, session, ...entityData } = updateStudentDto as any;

        // Parse JSON strings if they came via FormData
        if (typeof feeGroupIds === 'string') {
            try { feeGroupIds = JSON.parse(feeGroupIds); } catch (e) { }
        }
        if (typeof feeExclusions === 'string') {
            try { feeExclusions = JSON.parse(feeExclusions); } catch (e) { }
        }

        console.log('Entity Data to process:', entityData);

        // Map of ID fields to their relation names
        const relationMap: Record<string, string> = {
            classId: 'class',
            sectionId: 'section',
            categoryId: 'category',
            houseId: 'house',
            deactivateReasonId: 'deactivateReason',
            discountProfileId: 'discountProfile'
        };

        // 2. Manually update scalar fields and nullify relations if IDs change
        for (const key in entityData) {
            if (entityData.hasOwnProperty(key) && entityData[key] !== undefined) {
                const newValue = entityData[key];
                const currentValue = (student as any)[key];

                // If it's a relation ID field and it's changing, nullify the relation object
                if (relationMap[key] && newValue !== currentValue) {
                    console.log(`Relation ${key} changing from ${currentValue} to ${newValue}. Nullifying relation object: ${relationMap[key]}`);
                    (student as any)[relationMap[key]] = null;

                    // SPECIAL CASE: If Class changes, we MUST nullify Section as well (if not explicitly changing)
                    if (key === 'classId') {
                        console.log('Class changed. Nullifying Section relation for safety.');
                        (student as any).sectionId = null;
                        (student as any).section = null;
                    }
                }

                // Update the scalar ID column
                (student as any)[key] = newValue === '' ? null : newValue;
            }
        }

        // 3. Save the entity
        await this.studentsRepository.save(student as any);
        console.log('Student entity saved successfully');

        // Save new documents if any
        if (documentFiles && documentFiles.length > 0) {
            let titles: string[] = [];
            if (updateStudentDto.documentTitles) {
                titles = typeof updateStudentDto.documentTitles === 'string'
                    ? JSON.parse(updateStudentDto.documentTitles)
                    : updateStudentDto.documentTitles;
            }

            const docs = documentFiles.map((file, index) => {
                return this.documentRepository.create({
                    title: titles[index] || file.originalname,
                    filePath: file.path,
                    fileType: extname(file.originalname).substring(1),
                    studentId: id,
                    tenantId: tenantId
                });
            });
            await this.documentRepository.save(docs);
        }

        // --- Simplified Fee Allocation for MVP ---
        if (feeGroupIds && Array.isArray(feeGroupIds) && feeGroupIds.length > 0) {
            await this.feesService.assignFeesToStudent(id, feeGroupIds, tenantId, feeExclusions);
        }

        // Sync user account if photo or name changed
        if (student.userId) {
            try {
                await this.usersService.update(student.userId, {
                    firstName: student.firstName,
                    lastName: student.lastName,
                    photo: student.studentPhoto
                });
            } catch (err) {
                console.error(`Failed to sync user account for student ${student.id}:`, err);
            }
        }

        // Return the refreshed student with all relations correctly loaded
        return (await this.findOne(id, tenantId)) as Student;
    }

    async remove(id: string, tenantId: string): Promise<void> {
        const student = await this.findOne(id, tenantId);
        await this.studentsRepository.remove(student);
    }

    async deactivate(id: string, tenantId: string, reasonId?: string): Promise<Student> {
        const student = await this.findOne(id, tenantId);
        student.isActive = false;
        student.deactivatedAt = new Date();
        if (reasonId) {
            student.deactivateReasonId = reasonId;
        }
        
        await this.studentsRepository.save(student);

        // Deactivate User account if exists
        if (student.userId) {
            try {
                await this.usersService.update(student.userId, { isActive: false });
            } catch (error: any) {
                console.warn(`Failed to deactivate associated user ${student.userId} for student ${id}:`, error.message);
            }
        }

        return student;
    }

    async activate(id: string, tenantId: string): Promise<Student> {
        const student = await this.findOne(id, tenantId);
        student.isActive = true;
        student.deactivatedAt = undefined;
        student.deactivateReasonId = undefined;
        
        await this.studentsRepository.save(student);

        // Reactivate User account if exists
        if (student.userId) {
            try {
                await this.usersService.update(student.userId, { isActive: true });
            } catch (error: any) {
                console.warn(`Failed to reactivate associated user ${student.userId} for student ${id}:`, error.message);
            }
        }

        return student;
    }

    async removeDocument(id: string, tenantId: string): Promise<void> {
        const doc = await this.documentRepository.findOne({ where: { id, tenantId } });
        if (!doc) throw new NotFoundException(`Document with ID ${id} not found`);
        await this.documentRepository.remove(doc);
    }

    async findByUserId(userId: string): Promise<Student | null> {
        return this.studentsRepository.findOne({
            where: { userId },
            relations: ['class', 'section'],
        });
    }

    // --- Categories ---

    async createCategory(dto: CreateStudentCategoryDto, tenantId: string): Promise<StudentCategory> {
        try {
            const category = this.categoryRepository.create({ ...dto, tenantId });
            return await this.categoryRepository.save(category);
        } catch (error: any) {
            if (error.code === '23505' || error.errno === 19 || error.code === 'ER_DUP_ENTRY') { // Postgres unique_violation or SQLite constraint or MySQL
                throw new ConflictException('Category with this name already exists');
            }
            throw error;
        }
    }

    async findAllCategories(tenantId: string): Promise<StudentCategory[]> {
        try {
            const categories = await this.categoryRepository.find({ where: { tenantId } });
            console.log('Fetched Categories:', categories);
            return categories;
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    }

    async removeCategory(id: string, tenantId: string): Promise<void> {
        await this.categoryRepository.delete({ id, tenantId });
    }

    // --- Houses ---

    async createHouse(dto: CreateStudentHouseDto, tenantId: string): Promise<StudentHouse> {
        const house = this.houseRepository.create({ ...dto, tenantId });
        return this.houseRepository.save(house);
    }

    async findAllHouses(tenantId: string): Promise<StudentHouse[]> {
        return this.houseRepository.find({ where: { tenantId } });
    }

    async removeHouse(id: string, tenantId: string): Promise<void> {
        await this.houseRepository.delete({ id, tenantId });
    }

    // --- Deactivate Reasons ---

    async createDeactivateReason(dto: CreateDeactivateReasonDto, tenantId: string): Promise<DeactivateReason> {
        const reason = this.deactivateReasonRepository.create({ ...dto, tenantId });
        return this.deactivateReasonRepository.save(reason);
    }

    async findAllDeactivateReasons(tenantId: string): Promise<DeactivateReason[]> {
        return this.deactivateReasonRepository.find({ where: { tenantId } });
    }

    async removeDeactivateReason(id: string, tenantId: string): Promise<void> {
        await this.deactivateReasonRepository.delete({ id, tenantId });
    }

    // --- Online Admission ---
    private async generateAdmissionReference(tenantId: string): Promise<string> {
        const settings = await this.systemSettingsService.getSettings();
        const prefix = settings?.admissionReferencePrefix || 'ADM/';
        const year = new Date().getFullYear().toString();
        
        // Count total admissions to get the next sequence
        const count = await this.onlineAdmissionRepository.count({ where: { tenantId } });
        const sequence = (count + 1).toString().padStart(4, '0');
        
        return `${prefix}${year}/${sequence}`;
    }

    async createOnlineAdmission(dto: CreateOnlineAdmissionDto, tenantId: string): Promise<OnlineAdmission> {
        console.log('Creating Online Admission with DTO:', dto);
        const referenceNumber = await this.generateAdmissionReference(tenantId);
        
        const admission = this.onlineAdmissionRepository.create({ 
            ...dto, 
            referenceNumber,
            tenantId,
            preferredClassId: dto.preferredClassId,
            paymentStatus: dto.transactionReference ? 'paid' : 'pending',
            amountPaid: dto.transactionReference ? (await this.systemSettingsService.getSettings())?.admissionFee || 0 : 0
        });
        return this.onlineAdmissionRepository.save(admission);
    }

    async findAllOnlineAdmissions(tenantId: string): Promise<OnlineAdmission[]> {
        return this.onlineAdmissionRepository.find({
            where: { tenantId },
            relations: ['preferredClass'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOnlineAdmissionByReference(referenceNumber: string): Promise<OnlineAdmission> {
        const admission = await this.onlineAdmissionRepository.findOne({
            where: { referenceNumber: referenceNumber.toUpperCase() },
            relations: ['preferredClass'],
        });
        if (!admission) {
            throw new NotFoundException(`Application with reference ${referenceNumber} not found`);
        }
        return admission;
    }

    async findOneOnlineAdmission(id: string, tenantId: string): Promise<OnlineAdmission> {
        const admission = await this.onlineAdmissionRepository.findOne({ 
            where: { id, tenantId },
            relations: ['preferredClass']
        });
        if (!admission) throw new NotFoundException(`Online admission with ID ${id} not found`);
        return admission;
    }

    async updateOnlineAdmissionStatus(id: string, dto: UpdateOnlineAdmissionStatusDto, tenantId: string): Promise<OnlineAdmission> {
        const admission = await this.findOneOnlineAdmission(id, tenantId);
        admission.status = dto.status;
        return this.onlineAdmissionRepository.save(admission);
    }

    private async generateNextAdmissionNumber(tenantId: string): Promise<string> {
        const settings = await this.systemSettingsService.getSettings();
        const prefix = settings?.admissionNumberPrefix || 'SCH/';
        const year = new Date().getFullYear().toString();
        
        // Count total students to get the next sequence
        const count = await this.studentsRepository.count({ where: { tenantId } });
        const sequence = (count + 1).toString().padStart(4, '0');
        
        return `${prefix}${year}/${sequence}`;
    }

    async approveOnlineAdmission(id: string, tenantId: string): Promise<Student> {
        const admission = await this.findOneOnlineAdmission(id, tenantId);
        if (admission.status === 'approved') {
            throw new Error('Admission already approved');
        }

        const settings = await this.systemSettingsService.getSettings();
        const admissionNo = await this.generateNextAdmissionNumber(tenantId);

        // Map OnlineAdmission to CreateStudentDto
        const createStudentDto: CreateStudentDto = {
            firstName: admission.firstName,
            middleName: admission.middleName,
            lastName: admission.lastName,
            gender: admission.gender,
            dob: admission.dob,
            religion: admission.religion,
            bloodGroup: admission.bloodGroup,
            genotype: admission.genotype,
            stateOfOrigin: admission.stateOfOrigin,
            nationality: admission.nationality,
            guardianName: admission.guardianName,
            guardianPhone: admission.guardianPhone,
            guardianRelation: admission.guardianRelation,
            guardianEmail: admission.email, // Use applicant email as guardian email if not specified
            currentAddress: admission.currentAddress,
            previousSchoolName: admission.previousSchoolName,
            lastClassPassed: admission.lastClassPassed,
            medicalConditions: admission.medicalConditions,
            // Core Identity
            admissionNo: admissionNo,
            admissionDate: new Date(),
            classId: admission.preferredClassId,
            studentPhoto: admission.passportPhoto,
            // Security: Force password change on first login
            mustChangePassword: true,
            // Parent/Guardian contextual mapping
            fatherName: (admission.guardianRelation || '').toLowerCase() === 'father' ? admission.guardianName : undefined,
            fatherPhone: (admission.guardianRelation || '').toLowerCase() === 'father' ? admission.guardianPhone : undefined,
            motherName: (admission.guardianRelation || '').toLowerCase() === 'mother' ? admission.guardianName : undefined,
            motherPhone: (admission.guardianRelation || '').toLowerCase() === 'mother' ? admission.guardianPhone : undefined,
        };

        // Reuse existing create logic which handles parent creation/linking, fee allocation, and user provisioning
        const student = await this.create(createStudentDto, tenantId);

        // Update admission status and link records
        admission.status = 'approved';
        admission.finalAdmissionNo = admissionNo;
        admission.admittedStudentId = student.id;
        await this.onlineAdmissionRepository.save(admission);

        // --- Notifications ---
        try {
            const templates = await this.messageTemplatesService.findAll(tenantId);
            const template = templates.find(t => t.name === 'Admission Template');

            if (template) {
                // Fetch student current balance (from fees allocated during creation)
                let feeBalance = 0;
                try {
                    feeBalance = await this.feesService.getStudentCurrentBalance(student.id, tenantId);
                } catch (e: any) {
                    console.error('Failed to fetch initial fee balance for admission email:', e.message);
                }

                // Prepare Replacements for Template
                const replacements = {
                    '{first_name}': admission.firstName,
                    '{student_name}': `${admission.firstName} ${admission.lastName || ''}`.trim(),
                    '{guardian_name}': admission.guardianName || 'Parent/Guardian',
                    '{admission_no}': admissionNo,
                    '{reference_number}': admission.referenceNumber,
                    '{class_name}': (admission as any).preferredClass?.name || 'N/A',
                    '{school_name}': settings.schoolName || 'Our School',
                    '{portal_url}': process.env.FRONTEND_URL || 'http://localhost:5173',
                    '{fee_balance}': new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(feeBalance)
                };

                let processedBody = (template.body || '').replace(/\n/g, '<br />');
                Object.entries(replacements).forEach(([key, value]) => {
                    processedBody = processedBody.replace(new RegExp(key, 'g'), value);
                });

                // Send Premium Email to Guardian
                if (admission.email) {
                    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

                    await this.emailService.sendEmail({
                        to: admission.email,
                        subject: template.subject?.replace('{school_name}', settings.schoolName) || 'Admission Approved!',
                        html: `
                            <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                                <!-- Branding Header -->
                                <div style="background-color: #10b981; padding: 40px 20px; text-align: center;">
                                    <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); padding: 12px 24px; border-radius: 100px; color: #ffffff; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px;">
                                        Official Admission
                                    </div>
                                    <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -0.02em;">Admission Approved!</h1>
                                </div>

                                <!-- Main Content -->
                                <div style="padding: 40px 32px;">
                                    <div style="font-size: 16px; line-height: 1.8; color: #334155;">
                                        ${processedBody}
                                    </div>

                                    <!-- Security & Next Steps Note -->
                                    <div style="margin-top: 32px; padding: 24px; background-color: #f0fdf4; border-radius: 16px; border: 1px solid #dcfce7;">
                                        <div style="display: flex; gap: 12px; align-items: flex-start;">
                                            <div style="background-color: #10b981; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; display: flex; items-center; justify-center; flex-shrink: 0; font-size: 14px; font-weight: 800;">i</div>
                                            <div>
                                                <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #065f46;">Access Portal Details</h4>
                                                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #065f46;">For security reasons, your login credentials and further admission instructions are hosted on our secure tracking page. Please click the button below to view them.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Action Area -->
                                    <div style="margin-top: 40px; text-align: center;">
                                        <a href="${frontendUrl}/track-admission?ref=${admission.referenceNumber}" 
                                           style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 18px 40px; border-radius: 14px; font-size: 16px; font-weight: 800; text-decoration: none; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.2);">
                                            Track Application Status
                                        </a>
                                        <div style="margin-top: 20px; font-size: 13px; color: #64748b; font-weight: 500; font-style: italic;">
                                            * You will be required to change this password on your first login for security.
                                        </div>
                                    </div>
                                </div>

                                <!-- Footer -->
                                <div style="background-color: #f8fafc; padding: 32px; border-top: 1px solid #f1f5f9; text-align: center;">
                                    <p style="font-size: 14px; color: #64748b; margin: 0; font-weight: 600;">
                                        ${settings.schoolName || 'Our School'}
                                    </p>
                                    <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
                                        Powered by Antigravity™ Admission System
                                    </div>
                                </div>
                            </div>
                        `
                    });
                }

                // Send SMS to Guardian (guardianPhone is required in the entity)
                const smsMessage = `Congratulations! Your child ${admission.firstName}'s admission to ${settings.schoolName} has been approved. Admission No: ${admissionNo}. Check your email for details.`;
                await this.smsService.sendSms({
                    to: admission.guardianPhone,
                    message: smsMessage
                });
            }
        } catch (error) {
            console.error('Failed to send admission approval notifications:', error);
        }

        return student;
    }


    async promote(data: { studentIds: string[], classId: string, sectionId?: string }, tenantId: string): Promise<void> {
        if (!data.studentIds || data.studentIds.length === 0) return;
        
        const updatePayload: any = {
            classId: data.classId === '' ? null : data.classId,
            sectionId: (data.sectionId === '' ? null : data.sectionId) || null
        };

        await this.studentsRepository.update({ id: In(data.studentIds), tenantId }, updatePayload);
    }

    // --- Attendance ---

    async markAttendance(dto: MarkAttendanceDto, tenantId: string): Promise<StudentAttendance> {
        const sessionId = await this.systemSettingsService.getActiveSessionId();
        
        let attendance = await this.attendanceRepo.findOne({
            where: {
                studentId: dto.studentId,
                date: dto.date,
                tenantId,
                sessionId: sessionId || undefined
            }
        });

        if (attendance) {
            attendance.status = dto.status;
            attendance.remarks = dto.remarks;
            attendance.classId = dto.classId;
            attendance.sectionId = dto.sectionId;
            // Always ensure the session matches the current global active session
            if (sessionId) attendance.sessionId = sessionId;
        } else {
            attendance = this.attendanceRepo.create({
                ...dto,
                tenantId,
                sessionId: sessionId || undefined
            });
        }

        return this.attendanceRepo.save(attendance);
    }

    async bulkMarkAttendance(dto: BulkMarkAttendanceDto, tenantId: string): Promise<StudentAttendance[]> {
        const results: StudentAttendance[] = [];
        for (const record of dto.records) {
            const attendance = await this.markAttendance(record, tenantId);
            results.push(attendance);

            // Send notification if student is absent
            if (record.status === 'absent') {
                this.sendAbsenceNotification(record.studentId, record.date, tenantId).catch(err => {
                    console.error(`Failed to send absence notification for student ${record.studentId}:`, err);
                });
            }
        }
        return results;
    }

    private async sendAbsenceNotification(studentId: string, date: string, tenantId: string) {
        try {
            const student = await this.studentsRepository.findOne({
                where: { id: studentId, tenantId },
                relations: ['parent']
            });

            if (!student || !student.parent) return;

            const parentPhone = student.parent.guardianPhone;
            const parentEmail = student.parent.guardianEmail;
            const studentName = `${student.firstName} ${student.lastName}`;
            const formattedDate = new Date(date).toLocaleDateString();

            const message = `Attendance Alert: Your child, ${studentName}, was marked ABSENT today (${formattedDate}). Kindly contact the school for any clarification.`;

            if (parentPhone) {
                await this.smsService.sendSms({ to: parentPhone, message });
            }

            if (parentEmail) {
                await this.emailService.sendEmail({
                    to: parentEmail,
                    subject: `Absence Notification - ${studentName}`,
                    text: message,
                    html: `<p>${message}</p>`
                });
            }
        } catch (error) {
            console.error('Error in sendAbsenceNotification:', error);
        }
    }
    async getStudentAttendance(studentId: string, startDate: string, endDate: string, tenantId: string): Promise<StudentAttendance[]> {
        // Resolve the student ID since the studentId parameter might actually be a userId from the auth token
        const student = await this.studentsRepository.findOne({
            where: [
                { id: studentId, tenantId },
                { userId: studentId, tenantId }
            ]
        });

        if (!student) {
            throw new NotFoundException('Student not found');
        }

        const sessionId = await this.systemSettingsService.getActiveSessionId();
        const where: any = {
            studentId: student.id,
            date: Between(startDate, endDate) as any,
            tenantId
        };
        if (sessionId) where.sessionId = sessionId;

        return this.attendanceRepo.find({
            where,
            order: { date: 'ASC' }
        });
    }

    async getClassAttendance(classId: string, date: string, tenantId: string, sectionId?: string): Promise<StudentAttendance[]> {
        const sessionId = await this.systemSettingsService.getActiveSessionId();
        const where: any = { classId, date, tenantId };
        if (sectionId) where.sectionId = sectionId;
        if (sessionId) where.sessionId = sessionId;
        
        return this.attendanceRepo.find({
            where,
            relations: ['student']
        });
    }


    async getAttendanceLogs(startDate: string, endDate: string, tenantId: string, classId?: string, sectionId?: string, managedClassIds?: string[]): Promise<StudentAttendance[]> {
        const sessionId = await this.systemSettingsService.getActiveSessionId();
        
        const query = this.attendanceRepo.createQueryBuilder('attendance')
            .leftJoinAndSelect('attendance.student', 'student')
            .leftJoinAndSelect('attendance.class', 'class')
            .leftJoinAndSelect('attendance.section', 'section')
            .where('attendance.tenantId = :tenantId', { tenantId })
            .andWhere('attendance.date BETWEEN :startDate AND :endDate', { startDate, endDate });

        if (sessionId) {
            query.andWhere('attendance.sessionId = :sessionId', { sessionId });
        }

        if (classId) {
            query.andWhere('attendance.classId = :classId', { classId });
        } else if (managedClassIds && managedClassIds.length > 0) {
            query.andWhere('attendance.classId IN (:...managedClassIds)', { managedClassIds });
        }

        if (sectionId) {
            // First check if this is an academic section (exists in the record)
            // or if we need to filter by school section
            query.andWhere(new Brackets((qb: any) => {
                qb.where('attendance.sectionId = :sectionId', { sectionId })
                  .orWhere('class.schoolSectionId = :sectionId', { sectionId });
            }));
        }

        query.orderBy('attendance.date', 'DESC');

        return query.getMany();
    }

    // --- Bulk Import Helpers ---

    async validateBulk(data: any[], tenantId: string): Promise<any[]> {
        const results: any[] = [];
        
        // Fetch all dependencies to avoid multiple DB lookups in a loop
        const classes = await this.studentsRepository.query('SELECT id, name FROM "classes" WHERE "tenantId" = $1', [tenantId]);
        const sections = await this.studentsRepository.query('SELECT id, name, "classId" FROM "sections" WHERE "tenantId" = $1', [tenantId]);
        const categories = await this.categoryRepository.find({ where: { tenantId } });
        const houses = await this.houseRepository.find({ where: { tenantId } });
        const existingStudents = await this.studentsRepository.find({ where: { tenantId }, select: ['admissionNo'] });
        const admissionNos = new Set(existingStudents.map(s => s.admissionNo.toLowerCase()));

        for (const row of data) {
            const errors: string[] = [];
            const result: any = { ...row, errors: [] };

            // 1. Required Fields
            if (!row.admissionNo) errors.push('Admission Number is required');
            if (!row.firstName) errors.push('First Name is required');
            if (!row.gender) errors.push('Gender is required');
            if (!row.dob) errors.push('Date of Birth is required');
            if (!row.admissionDate) errors.push('Admission Date is required');

            // 2. Duplicate Check
            if (row.admissionNo && admissionNos.has(row.admissionNo.toString().toLowerCase())) {
                errors.push(`Duplicate Admission Number: ${row.admissionNo}`);
            }

            // 3. Resolve Dependencies (Names to IDs)
            if (row.className) {
                const cls = classes.find((c: any) => c.name.toLowerCase() === row.className.toLowerCase());
                if (cls) {
                    result.classId = cls.id;
                    if (row.sectionName) {
                        const sec = sections.find((s: any) => s.name.toLowerCase() === row.sectionName.toLowerCase() && s.classId === cls.id);
                        if (sec) result.sectionId = sec.id;
                        else errors.push(`Section "${row.sectionName}" not found in class "${row.className}"`);
                    }
                } else {
                    errors.push(`Class "${row.className}" not found`);
                }
            }

            if (row.categoryName) {
                const cat = categories.find(c => c.category.toLowerCase() === row.categoryName.toLowerCase());
                if (cat) result.categoryId = cat.id;
                else errors.push(`Category "${row.categoryName}" not found`);
            }

            if (row.houseName) {
                const house = houses.find(h => h.houseName.toLowerCase() === row.houseName.toLowerCase());
                if (house) result.houseId = house.id;
                else errors.push(`House "${row.houseName}" not found`);
            }

            result.validationStatus = errors.length > 0 ? 'Invalid' : 'Valid';
            result.errors = errors;
            results.push(result);
        }

        return results;
    }
}

