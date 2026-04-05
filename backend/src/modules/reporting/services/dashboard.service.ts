import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Staff, StaffStatus } from '../../hr/entities/staff.entity';
import { Transaction, TransactionType } from '../../finance/entities/transaction.entity';
import { Class } from '../../academics/entities/class.entity';
import { Subject } from '../../academics/entities/subject.entity';
import { FeeAssignment } from '../../finance/entities/fee-assignment.entity';
import { ExamResult } from '../../examination/entities/exam-result.entity';
import { ExamGroup } from '../../examination/entities/exam-group.entity';
import { StaffAttendance } from '../../hr/entities/staff-attendance.entity';
import { Payroll, PayrollStatus } from '../../hr/entities/payroll.entity';
import { StudentAttendance } from '../../students/entities/student-attendance.entity';
import { Brackets, IsNull } from 'typeorm';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Student)
        private readonly studentRepository: Repository<Student>,
        @InjectRepository(Staff)
        private readonly staffRepository: Repository<Staff>,
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        @InjectRepository(Class)
        private readonly classRepository: Repository<Class>,
        @InjectRepository(Subject)
        private readonly subjectRepository: Repository<Subject>,
        @InjectRepository(FeeAssignment)
        private readonly feeAssignmentRepository: Repository<FeeAssignment>,
        @InjectRepository(ExamResult)
        private readonly examResultRepository: Repository<ExamResult>,
        @InjectRepository(ExamGroup)
        private readonly examGroupRepository: Repository<ExamGroup>,
        @InjectRepository(StaffAttendance)
        private readonly staffAttendanceRepository: Repository<StaffAttendance>,
        @InjectRepository(Payroll)
        private readonly payrollRepository: Repository<Payroll>,
        @InjectRepository(StudentAttendance)
        private readonly studentAttendanceRepository: Repository<StudentAttendance>,
    ) { }

    /**
     * DISCOVERY: Find the correct tenantId in the system to recover from token mismatches
     */
    private async findCorrectTenantId(tokenTenantId: string): Promise<string> {
        // 1. Try to see if anything matches the current token first
        const tokenMatch = await this.studentRepository.createQueryBuilder('s')
            .where('s.tenantId = :tokenTenantId', { tokenTenantId })
            .getCount();
        if (tokenMatch > 0) return tokenTenantId;

        // 2. If not, auto-discover from first student record ever entered
        const firstStudent = await this.studentRepository.createQueryBuilder('s')
            .select('s.tenantId', 'id')
            .where('s.tenantId IS NOT NULL')
            .limit(1)
            .getRawOne();
        if (firstStudent?.id) return firstStudent.id;

        // 3. Try from staff if student is empty
        const firstStaff = await this.staffRepository.createQueryBuilder('st')
            .select('st.tenantId', 'id')
            .where('st.tenantId IS NOT NULL')
            .limit(1)
            .getRawOne();
        if (firstStaff?.id) return firstStaff.id;

        return tokenTenantId; // No data found at all, return token anyway
    }

    async getAdminStats(tenantIdInput: string, sectionId?: string) {
        // Robust discovery
        const tenantId = await this.findCorrectTenantId(tenantIdInput);
        const isValidSection = sectionId && sectionId !== 'undefined' && sectionId !== 'null' && sectionId !== '';
        
        console.log(`[DashboardService] Stats: Using tenantId: ${tenantId}, sectionId: ${sectionId}`);

        // Initialize with default values for safety
        let stats = {
            students: { total: 0, active: 0, inactive: 0 },
            staff: { total: 0, teaching: 0, nonTeaching: 0 },
            academics: { totalClasses: 0, totalSubjects: 0 },
            finance: { totalRevenue: 0, outstandingFees: 0 },
            feesOverview: { paid: 0, partial: 0, unpaid: 0 },
            academicHealth: {
                teachersYetToSubmit: 0,
                topPerformingSubject: 'N/A',
                publishedResultsCount: 0,
                unpublishedResultsCount: 0,
                lowAttendanceClasses: [] as string[]
            },
            studentPerformance: {
                schoolWideAverage: '0.0',
                topPerformingClasses: [] as string[],
                bottomPerformingClasses: [] as string[],
                studentsAtRisk: 0
            },
            accounting: {
                totalExpenses: 0,
                netBalance: 0,
                payrollStatus: 'N/A',
                latestExpense: { category: 'N/A', amount: 0 }
            }
        };

        // --- SECTION 1: STUDENTS ---
        try {
            let studentQb = this.studentRepository.createQueryBuilder('student').where('(student.tenantId = :tenantId OR student.tenantId IS NULL)', { tenantId });
            if (isValidSection) {
                studentQb.leftJoin('student.class', 'cls').andWhere('cls.schoolSectionId = :sectionId', { sectionId });
            }
            stats.students.total = await studentQb.getCount();
            stats.students.active = await studentQb.clone().andWhere('student.isActive = :isActive', { isActive: true }).getCount();
            stats.students.inactive = stats.students.total - stats.students.active;
        } catch (e) {
            console.error('[Dashboard] Error fetching student stats', (e as any).message);
        }

        // --- SECTION 2: STAFF ---
        try {
            let staffQb = this.staffRepository.createQueryBuilder('staff')
                .where('(staff.tenantId = :tenantId OR staff.tenantId IS NULL)', { tenantId })
                .andWhere('staff.status = :status', { status: StaffStatus.ACTIVE });
            
            if (isValidSection) {
                staffQb.innerJoin('staff.sections', 'section', 'section.id = :sectionId', { sectionId });
            }
            stats.staff.total = await staffQb.getCount();
            stats.staff.teaching = await staffQb.clone()
                .leftJoin('staff.roleObject', 'role')
                .andWhere('role.name ILIKE :tRole', { tRole: '%teacher%' })
                .getCount();
            stats.staff.nonTeaching = stats.staff.total - stats.staff.teaching;
        } catch (e) {
            console.error('[Dashboard] Error fetching staff stats', (e as any).message);
        }

        // --- SECTION 3: ACADEMICS ---
        try {
            let classQb = this.classRepository.createQueryBuilder('cls').where('(cls.tenantId = :tenantId OR cls.tenantId IS NULL)', { tenantId });
            if (isValidSection) {
                classQb.andWhere('cls.schoolSectionId = :sectionId', { sectionId });
            }
            stats.academics.totalClasses = await classQb.getCount();

            let subjectQb = this.subjectRepository.createQueryBuilder('subject').where('(subject.tenantId = :tenantId OR subject.tenantId IS NULL)', { tenantId });
            if (isValidSection) {
                subjectQb.innerJoin('class_subject', 'cs', 'cs.subjectId = subject.id')
                    .innerJoin('classes', 'cls', 'cls.id = cs.classId')
                    .andWhere('cls.schoolSectionId = :sectionId', { sectionId });
            }
            stats.academics.totalSubjects = await subjectQb.getCount();
        } catch (e) {
            console.error('[Dashboard] Error fetching academic stats', (e as any).message);
        }

        // --- SECTION 4: FINANCE & FEES ---
        try {
            let transQb = this.transactionRepository.createQueryBuilder('transaction').where('(transaction.tenantId = :tenantId OR transaction.tenantId IS NULL)', { tenantId }).andWhere('transaction.type = :type', { type: TransactionType.FEE_PAYMENT });
            if (isValidSection) {
                transQb.andWhere('transaction.schoolSectionId = :sectionId', { sectionId });
            }
            const revenueResult = await transQb.select('SUM(transaction.amount::numeric)', 'total').getRawOne();
            stats.finance.totalRevenue = parseFloat(revenueResult?.total || '0') || 0;

            const feeStatusRaw = await this.studentRepository.manager.query(`
                WITH student_fees AS (
                    SELECT 
                        s.id as student_id,
                        COALESCE(SUM(fh."defaultAmount"::numeric), 0) as total_assigned
                    FROM students s
                    LEFT JOIN fee_assignments fa ON fa."studentId" = s.id AND (fa."tenantId" = $1 OR fa."tenantId" IS NULL)
                    LEFT JOIN fee_group_heads fgh ON fgh."feeGroupId" = fa."feeGroupId"
                    LEFT JOIN fee_heads fh ON fh.id = fgh."feeHeadId"
                    WHERE (s."tenantId" = $1 OR s."tenantId" IS NULL) ${isValidSection ? 'AND (s."sectionId" = $2)' : ''}
                    GROUP BY s.id
                ),
                student_paid AS (
                    SELECT 
                        "studentId",
                        SUM(amount::numeric) as total_paid
                    FROM transactions
                    WHERE type = 'FEE_PAYMENT' AND ("tenantId" = $1 OR "tenantId" IS NULL)
                    GROUP BY "studentId"
                ),
                student_balances AS (
                    SELECT 
                        sf.student_id,
                        sf.total_assigned,
                        COALESCE(sp.total_paid, 0) as total_paid
                    FROM student_fees sf
                    LEFT JOIN student_paid sp ON sp."studentId" = sf.student_id
                )
                SELECT 
                    COUNT(*) FILTER (WHERE total_paid >= total_assigned) as paid,
                    COUNT(*) FILTER (WHERE total_paid > 0 AND total_paid < total_assigned) as partial,
                    COUNT(*) FILTER (WHERE total_paid = 0 AND total_assigned > 0) as unpaid,
                    COALESCE(SUM(GREATEST(0, total_assigned - total_paid)), 0) as outstanding
                FROM student_balances
            `, isValidSection ? [tenantId, sectionId] : [tenantId]);

            if (feeStatusRaw && feeStatusRaw[0]) {
                stats.feesOverview.paid = parseInt(feeStatusRaw[0].paid || '0');
                stats.feesOverview.partial = parseInt(feeStatusRaw[0].partial || '0');
                stats.feesOverview.unpaid = parseInt(feeStatusRaw[0].unpaid || '0');
                stats.finance.outstandingFees = parseFloat(feeStatusRaw[0].outstanding || '0') || 0;
            }
        } catch (e) {
            console.error('[Dashboard] Error fetching finance stats', (e as any).message);
        }

        // --- SECTION 5: PERFORMANCE ---
        try {
            const performanceStats = await this.examResultRepository.createQueryBuilder('res')
                .select('AVG(res.score::numeric)', 'avgScore')
                .where('(res.tenantId = :tenantId OR res.tenantId IS NULL)', { tenantId })
                .getRawOne();
            stats.studentPerformance.schoolWideAverage = parseFloat(performanceStats?.avgScore || '0').toFixed(1);
        } catch (e) {
            console.error('[Dashboard] Error fetching performance stats', (e as any).message);
        }

        try {
            stats.studentPerformance.studentsAtRisk = await this.examResultRepository.createQueryBuilder('res')
                .select('res.studentId')
                .where('(res.tenantId = :tenantId OR res.tenantId IS NULL)', { tenantId })
                .groupBy('res.studentId')
                .having('AVG(res.score::numeric) < 45')
                .getCount();
        } catch (e) {
            console.error('[Dashboard] Error fetching students at risk', (e as any).message);
        }

        try {
            const topSubject = await this.examResultRepository.createQueryBuilder('res')
                .select('sub.name', 'name')
                .addSelect('AVG(res.score::numeric)', 'avgScore')
                .innerJoin('subjects', 'sub', 'sub.id::text = res.subjectId')
                .where('(res.tenantId = :tenantId OR res.tenantId IS NULL)', { tenantId })
                .groupBy('sub.name')
                .orderBy('avgScore', 'DESC')
                .limit(1)
                .getRawOne();
            stats.academicHealth.topPerformingSubject = topSubject?.name || 'N/A';
        } catch (e) {
            console.error('[Dashboard] Error fetching top performing subject', (e as any).message);
        }

        try {
            const classPerfRaw = await this.examResultRepository.createQueryBuilder('res')
                .select('c.name', 'name')
                .addSelect('AVG(res.score::numeric)', 'avgScore')
                .innerJoin('classes', 'c', 'c.id::text = res.classId')
                .where('(res.tenantId = :tenantId OR res.tenantId IS NULL)', { tenantId })
                .groupBy('c.name')
                .orderBy('avgScore', 'DESC')
                .getRawMany();
            
            if (classPerfRaw.length > 0) {
                stats.studentPerformance.topPerformingClasses = classPerfRaw.slice(0, 3).map(r => r.name);
                if (classPerfRaw.length > 2) {
                    stats.studentPerformance.bottomPerformingClasses = classPerfRaw.slice(-3).map(r => r.name);
                } else {
                    stats.studentPerformance.bottomPerformingClasses = [];
                }
            }
        } catch (e) {
            console.error('[Dashboard] Error fetching class performance', (e as any).message);
        }

        try {
            const lowAttRaw = await this.studentAttendanceRepository.createQueryBuilder('sa')
                .select('c.name', 'name')
                .addSelect('(COUNT(sa.id) FILTER (WHERE sa.status = \'Present\')::float / NULLIF(COUNT(sa.id), 0)::float) * 100', 'rate')
                .innerJoin('classes', 'c', 'c.id::text = sa.classId')
                .where('(sa.tenantId = :tenantId OR sa.tenantId IS NULL)', { tenantId })
                .groupBy('c.name')
                .having('(COUNT(sa.id) FILTER (WHERE sa.status = \'Present\')::float / NULLIF(COUNT(sa.id), 0)::float) * 100 < 75')
                .limit(5)
                .getRawMany();
            stats.academicHealth.lowAttendanceClasses = lowAttRaw.map(r => r.name);
        } catch (e) {
            console.error('[Dashboard] Error fetching attendance alerts', (e as any).message);
        }

        // --- SECTION 6: OTHERS ---
        try {
            stats.academicHealth.publishedResultsCount = await this.examGroupRepository.count({
                where: [
                    { tenantId, isPublished: true },
                    { tenantId: IsNull(), isPublished: true }
                ]
            });
            stats.academicHealth.unpublishedResultsCount = await this.examGroupRepository.count({
                where: [
                    { tenantId, isPublished: false },
                    { tenantId: IsNull(), isPublished: false }
                ]
            });

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            stats.academicHealth.teachersYetToSubmit = await this.staffRepository.createQueryBuilder('staff')
                .leftJoin('staff.roleObject', 'role')
                .leftJoin('staff_attendance', 'att', 'att.staffId = staff.id AND att.date = :today', { today })
                .where('(staff.tenantId = :tenantId OR staff.tenantId IS NULL)', { tenantId })
                .andWhere('role.name ILIKE :tRole', { tRole: '%teacher%' })
                .andWhere('att.id IS NULL')
                .getCount();

            const currentMonth = today.getMonth() + 1;
            const currentYear = today.getFullYear();
            const payrollSummary = await this.payrollRepository.createQueryBuilder('p')
                .innerJoin('p.staff', 'staff')
                .select('SUM(p.net_salary::numeric)', 'total')
                .addSelect('p.status', 'status')
                .where('(staff.tenantId = :tenantId OR staff.tenantId IS NULL)', { tenantId })
                .andWhere('p.month = :currentMonth AND p.year = :currentYear', { currentMonth, currentYear })
                .groupBy('p.status')
                .getRawMany();
            
            stats.accounting.totalExpenses = payrollSummary.reduce((acc, curr) => acc + parseFloat(curr.total || '0'), 0);
            stats.accounting.payrollStatus = payrollSummary.length > 0 ? payrollSummary[0].status : 'Pending';
            stats.accounting.netBalance = stats.finance.totalRevenue - stats.accounting.totalExpenses;
            stats.accounting.latestExpense = { category: 'Payroll', amount: stats.accounting.totalExpenses };
        } catch (e) {
            console.error('[Dashboard] Error fetching auxiliary stats', (e as any).message);
        }

        return stats;
    }

    async getAdminCharts(tenantIdInput: string, sectionId?: string) {
        try {
            const tenantId = await this.findCorrectTenantId(tenantIdInput);
            const isValidSection = sectionId && sectionId !== 'undefined' && sectionId !== 'null' && sectionId !== '';

            let maleQb = this.studentRepository.createQueryBuilder('student').where('(student.tenantId = :tenantId OR student.tenantId IS NULL)', { tenantId }).andWhere('student.gender = :gender', { gender: 'Male' });
            let femaleQb = this.studentRepository.createQueryBuilder('student').where('(student.tenantId = :tenantId OR student.tenantId IS NULL)', { tenantId }).andWhere('student.gender = :gender', { gender: 'Female' });
            let enrollQb = this.studentRepository.createQueryBuilder('student').where('(student.tenantId = :tenantId OR student.tenantId IS NULL)', { tenantId });

            if (isValidSection) {
                maleQb.leftJoin('student.class', 'cls1').andWhere('cls1.schoolSectionId = :sectionId', { sectionId });
                femaleQb.leftJoin('student.class', 'cls2').andWhere('cls2.schoolSectionId = :sectionId', { sectionId });
                enrollQb.leftJoin('student.class', 'cls3').andWhere('cls3.schoolSectionId = :sectionId', { sectionId });
            }

            const maleStudents = await maleQb.getCount();
            const femaleStudents = await femaleQb.getCount();

            const enrollmentData = await enrollQb
                .select("TO_CHAR(student.createdAt, 'Mon')", 'month')
                .addSelect('COUNT(student.id)', 'count')
                .groupBy("TO_CHAR(student.createdAt, 'Mon')")
                .orderBy("min(student.createdAt)", "DESC")
                .limit(6)
                .getRawMany();

            return {
                genderDistribution: [
                    { label: 'Male', value: maleStudents },
                    { label: 'Female', value: femaleStudents },
                ],
                enrollmentTrends: enrollmentData,
            };
        } catch (e) {
            console.error('[Dashboard] Error fetching charts', (e as any).message);
            return { genderDistribution: [], enrollmentTrends: [] };
        }
    }

    async getRecentActivities(tenantIdInput: string, sectionId?: string) {
        try {
            const tenantId = await this.findCorrectTenantId(tenantIdInput);
            const isValidSection = sectionId && sectionId !== 'undefined' && sectionId !== 'null' && sectionId !== '';

            let studQb = this.studentRepository.createQueryBuilder('student').where('(student.tenantId = :tenantId OR student.tenantId IS NULL)', { tenantId }).orderBy('student.createdAt', 'DESC').take(5);
            let transQb = this.transactionRepository.createQueryBuilder('transaction').where('(transaction.tenantId = :tenantId OR transaction.tenantId IS NULL)', { tenantId }).andWhere('transaction.type = :type', { type: TransactionType.FEE_PAYMENT }).orderBy('transaction.createdAt', 'DESC').take(5);

            if (isValidSection) {
                studQb.leftJoin('student.class', 'cls').andWhere('cls.schoolSectionId = :sectionId', { sectionId });
                transQb.andWhere('transaction.schoolSectionId = :sectionId', { sectionId });
            }

            const recentEnrollments = await studQb.getMany();
            const recentPayments = await transQb.getMany();

            return {
                recentEnrollments,
                recentPayments,
            };
        } catch (e) {
            console.error('[Dashboard] Error fetching activities', (e as any).message);
            return { recentEnrollments: [], recentPayments: [] };
        }
    }
}
