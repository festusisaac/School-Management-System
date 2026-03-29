import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, Between, In } from 'typeorm';
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
import { EmailService } from '../../communication/email.service';
import { SmsService } from '../../communication/sms.service';
import { StudentAttendance } from '../entities/student-attendance.entity';
import { MarkAttendanceDto, BulkMarkAttendanceDto } from '../dtos/student-attendance.dto';
import { SystemSettingsService } from '../../system/services/system-settings.service';

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
        private feesService: FeesService,
        private usersService: UsersService,
        private emailService: EmailService,
        private smsService: SmsService,
        private systemSettingsService: SystemSettingsService,
    ) { }

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
        let { feeGroupIds, session, documentTitles, feeExclusions, ...studentData } = createStudentDto;

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
        });
        const savedStudent = await this.studentsRepository.save(student);

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
            const studentUser = await this.usersService.findOrCreateUser(studentEmail, {
                firstName: savedStudent.firstName,
                lastName: savedStudent.lastName || '',
                password: `Student@${savedStudent.admissionNo}`,
                role: 'student',
                roleId: studentRole?.id,
                tenantId: tenantId,
                photo: savedStudent.studentPhoto
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
                `Student@${savedStudent.admissionNo}`,
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
        (student as any).feeGroupIds = assignments.map(a => a.feeGroupId);

        // Returnexclusions as well
        const exclusions: Record<string, string[]> = {};
        assignments.forEach(a => {
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
        await this.studentsRepository.save(student);
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

    async createOnlineAdmission(dto: CreateOnlineAdmissionDto, tenantId: string): Promise<OnlineAdmission> {
        const admission = this.onlineAdmissionRepository.create({ ...dto, tenantId });
        return this.onlineAdmissionRepository.save(admission);
    }

    async findAllOnlineAdmissions(tenantId: string): Promise<OnlineAdmission[]> {
        return this.onlineAdmissionRepository.find({
            where: { tenantId },
            order: { createdAt: 'DESC' },
        });
    }

    async findOneOnlineAdmission(id: string, tenantId: string): Promise<OnlineAdmission> {
        const admission = await this.onlineAdmissionRepository.findOne({ where: { id, tenantId } });
        if (!admission) throw new NotFoundException(`Online admission with ID ${id} not found`);
        return admission;
    }

    async updateOnlineAdmissionStatus(id: string, dto: UpdateOnlineAdmissionStatusDto, tenantId: string): Promise<OnlineAdmission> {
        const admission = await this.findOneOnlineAdmission(id, tenantId);
        admission.status = dto.status;
        return this.onlineAdmissionRepository.save(admission);
    }

    async approveOnlineAdmission(id: string, tenantId: string): Promise<Student> {
        const admission = await this.findOneOnlineAdmission(id, tenantId);
        if (admission.status === 'approved') {
            throw new Error('Admission already approved');
        }

        // Generate a temporary admission number if needed, or let the system handle it
        // For now, we'll generate a placeholder
        const admissionNo = `OA-${Date.now().toString().slice(-6)}`;

        // Map OnlineAdmission to CreateStudentDto
        const createStudentDto: CreateStudentDto = {
            firstName: admission.firstName,
            lastName: admission.lastName,
            gender: admission.gender,
            dob: admission.dob, // Pass Date object directly
            guardianName: admission.guardianName,
            guardianPhone: admission.guardianPhone,
            guardianRelation: admission.guardianRelation,
            currentAddress: admission.currentAddress,
            // Defaults
            admissionNo: admissionNo,
            admissionDate: new Date(), // Pass Date object directly
            classId: admission.preferredClassId,
            fatherName: admission.guardianRelation.toLowerCase() === 'father' ? admission.guardianName : undefined,
            fatherPhone: admission.guardianRelation.toLowerCase() === 'father' ? admission.guardianPhone : undefined,
            motherName: admission.guardianRelation.toLowerCase() === 'mother' ? admission.guardianName : undefined,
            motherPhone: admission.guardianRelation.toLowerCase() === 'mother' ? admission.guardianPhone : undefined,
        };

        // Reuse existing create logic which handles parent creation/linking
        const student = await this.create(createStudentDto, tenantId);

        // Update admission status
        admission.status = 'approved';
        await this.onlineAdmissionRepository.save(admission);

        return student;
    }


    async promote(data: { studentIds: string[], classId: string, sectionId?: string }, tenantId: string): Promise<void> {
        if (!data.studentIds || data.studentIds.length === 0) return;
        
        await this.studentsRepository.update({ id: Like(data.studentIds as any), tenantId }, {
            classId: data.classId,
            sectionId: (data.sectionId || undefined) as any
        });
    }

    // --- Attendance ---

    async markAttendance(dto: MarkAttendanceDto, tenantId: string): Promise<StudentAttendance> {
        let attendance = await this.attendanceRepo.findOne({
            where: {
                studentId: dto.studentId,
                date: dto.date,
                tenantId
            }
        });

        if (attendance) {
            attendance.status = dto.status;
            attendance.remarks = dto.remarks;
            attendance.classId = dto.classId;
            attendance.sectionId = dto.sectionId;
        } else {
            const sessionId = await this.systemSettingsService.getActiveSessionId();
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
                await this.smsService.sendSms(parentPhone, message);
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
        const where: any = {
            date: Between(startDate, endDate) as any,
            tenantId
        };
        if (sessionId) where.sessionId = sessionId;
        if (classId) {
            where.classId = classId;
        } else if (managedClassIds && managedClassIds.length > 0) {
            where.classId = In(managedClassIds);
        }
        
        if (sectionId) where.sectionId = sectionId;

        return this.attendanceRepo.find({
            where,
            relations: ['student', 'class', 'section'],
            order: { date: 'DESC' }
        });
    }
}

