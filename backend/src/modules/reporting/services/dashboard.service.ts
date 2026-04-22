import { Injectable, NotFoundException } from '@nestjs/common';
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
import { AttendanceStatus, StaffAttendance } from '../../hr/entities/staff-attendance.entity';
import { Payroll, PayrollStatus } from '../../hr/entities/payroll.entity';
import { StudentAttendance } from '../../students/entities/student-attendance.entity';
import { StudentTermResult } from '../../examination/entities/student-term-result.entity';
import { CarryForward } from '../../finance/entities/carry-forward.entity';
import { AcademicSession } from '../../system/entities/academic-session.entity';
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
        @InjectRepository(StudentTermResult)
        private readonly studentTermResultRepository: Repository<StudentTermResult>,
        @InjectRepository(CarryForward)
        private readonly carryForwardRepository: Repository<CarryForward>,
        @InjectRepository(AcademicSession)
        private readonly academicSessionRepository: Repository<AcademicSession>,
    ) { }

    private async getSessionDateRange(sessionId?: string) {
        if (!sessionId) {
            return null;
        }

        const session = await this.academicSessionRepository.findOne({ where: { id: sessionId } });
        if (!session?.startDate || !session?.endDate) {
            return null;
        }

        return {
            startDate: new Date(session.startDate),
            endDate: new Date(session.endDate),
        };
    }

    private dedupeAssignments(assignments: FeeAssignment[]) {
        const latestByGroup = new Map<string, FeeAssignment>();
        assignments.forEach((assignment) => {
            const existing = latestByGroup.get(assignment.feeGroupId);
            if (!existing) {
                latestByGroup.set(assignment.feeGroupId, assignment);
                return;
            }

            const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
            const nextTime = new Date(assignment.updatedAt || assignment.createdAt || 0).getTime();
            if (nextTime >= existingTime) {
                latestByGroup.set(assignment.feeGroupId, assignment);
            }
        });
        return Array.from(latestByGroup.values());
    }

    private async getStudentFeeSnapshot(
        studentId: string,
        tenantId: string,
        sessionId?: string,
        sessionName?: string | null, // Pre-fetched by caller to avoid N repeated lookups
    ) {
        // Fetch transactions for this student. Include NULL sessionId records so that
        // older payments (recorded before sessionId was added) are still counted.
        let allTransactions: any[];
        if (sessionId) {
            allTransactions = await this.transactionRepository.createQueryBuilder('tx')
                .where('tx.studentId = :studentId', { studentId })
                .andWhere('(tx.tenantId = :tenantId OR tx.tenantId IS NULL)', { tenantId })
                .andWhere('(tx.sessionId::text = :sessionId OR tx.sessionId IS NULL)', { sessionId })
                .getMany();
        } else {
            allTransactions = await this.transactionRepository.find({ where: { studentId, tenantId } });
        }
        const transactions = allTransactions.filter((tx) => tx.type !== TransactionType.CARRY_FORWARD);

        const cfWhere: any = { studentId, tenantId };
        const carryForwards = await this.carryForwardRepository.find({
            where: sessionId
                ? [
                    { ...cfWhere, sessionId },
                    { ...cfWhere, sessionId: IsNull(), academicYear: sessionName || undefined },
                ]
                : cfWhere,
        });

        const assignmentWhere: any = { studentId, isActive: true, tenantId };
        // NOTE: Do NOT filter fee assignments by sessionId — many legacy assignments
        // were created before sessionId was tracked and have NULL. Filtering strictly would
        // produce an outstandingFees of 0 for those students.

        const assignments = this.dedupeAssignments(await this.feeAssignmentRepository.find({
            where: assignmentWhere,
            relations: ['feeGroup', 'feeGroup.heads'],
        }));

        const paidByHead: Record<string, number> = {};
        transactions.forEach((tx) => {
            const allocations = tx.meta?.allocations || [];
            if (Array.isArray(allocations)) {
                allocations.forEach((allocation: any) => {
                    if (allocation?.id) {
                        paidByHead[allocation.id] = (paidByHead[allocation.id] || 0) + parseFloat(allocation.amount || '0');
                    }
                });
            }
        });

        const assignedTotal = assignments.reduce((sum, assignment) => {
            const excludedIds = assignment.excludedHeadIds || [];
            const groupHeads = assignment.feeGroup?.heads || [];
            const headTotal = groupHeads
                .filter((head) => !excludedIds.includes(head.id))
                .reduce((headSum, head) => headSum + parseFloat(head.defaultAmount || '0'), 0);
            return sum + headTotal;
        }, 0);

        const carryForwardTotal = carryForwards.reduce((sum, carryForward) => sum + parseFloat(carryForward.amount || '0'), 0);
        const totalDue = assignedTotal + carryForwardTotal;
        const totalPaid = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0);
        const balance = Math.max(0, totalDue - totalPaid);

        return {
            totalDue,
            totalPaid,
            balance,
            hasAssignments: assignments.length > 0,
            hasCarryForwards: carryForwards.length > 0,
        };
    }

    /**
     * DISCOVERY: Find the correct tenantId in the system to recover from token mismatches
     */
    private async findCorrectTenantId(tokenTenantId: string): Promise<string> {
        // 1. Try to see if anything matches the current token first
        const tokenMatch = await this.studentRepository.createQueryBuilder('s')
            .where('s.tenantId = :tokenTenantId', { tokenTenantId })
            .getCount();
        if (tokenMatch > 0) return tokenTenantId;

        // 2. Do NOT fall back to LIMIT 1 from another tenant — that causes cross-tenant
        //    data contamination. Return the token's tenantId and let the query resolve naturally.
        return tokenTenantId;
    }

    async getAdminStats(tenantIdInput: string, sectionId?: string, sessionId?: string, termId?: string) {
        // Robust discovery
        const tenantId = await this.findCorrectTenantId(tenantIdInput);
        const isValidSection = sectionId && sectionId !== 'undefined' && sectionId !== 'null' && sectionId !== '';
        const isValidSession = sessionId && sessionId !== 'undefined' && sessionId !== 'null' && sessionId !== '';
        const isValidTerm = termId && termId !== 'undefined' && termId !== 'null' && termId !== '';
        
        console.log(`[DashboardService] Stats: Using tenantId: ${tenantId}, sectionId: ${sectionId}, sessionId: ${sessionId}, termId: ${termId}`);

        // Initialize with default values for safety
        let stats = {
            students: { total: 0, active: 0, inactive: 0 },
            staff: { total: 0, teaching: 0, nonTeaching: 0 },
            academics: { totalClasses: 0, totalSubjects: 0 },
            finance: { totalRevenue: 0, outstandingFees: 0 },
            feesOverview: { paid: 0, partial: 0, unpaid: 0 },
            academicHealth: {
                staffPresentToday: 0,
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
            let transQb = this.transactionRepository.createQueryBuilder('transaction')
                .where('(transaction.tenantId = :tenantId OR transaction.tenantId IS NULL)', { tenantId })
                .andWhere('transaction.type = :type', { type: TransactionType.FEE_PAYMENT });
            if (isValidSection) {
                // Joins are only needed when filtering by section.
                // Use lowercase aliases — PostgreSQL lowercases unquoted identifiers in ON clauses,
                // so a mixed-case alias like 'txStudent' would cause a "missing FROM-clause entry" error.
                transQb
                    .leftJoin('students', 'txstudent', 'txstudent.id::text = transaction."studentId"::text')
                    .leftJoin('classes', 'txclass', 'txclass.id::text = txstudent."classId"::text')
                    .andWhere(new Brackets((qb) => {
                        qb.where('"transaction"."schoolSectionId"::text = CAST(:sectionId AS text)', { sectionId })
                            .orWhere('"transaction"."schoolSectionId" IS NULL AND txclass."schoolSectionId"::text = CAST(:sectionId AS text)', { sectionId });
                    }));
            }
            if (isValidSession) {
                transQb.andWhere(
                    new Brackets((qb) => {
                        qb.where('"transaction"."sessionId"::text = CAST(:sessionId AS text)', { sessionId })
                          .orWhere('"transaction"."sessionId" IS NULL');
                    })
                );
            }
            const revenueResult = await transQb.select('SUM(transaction.amount::numeric)', 'total').getRawOne();
            stats.finance.totalRevenue = parseFloat(revenueResult?.total || '0') || 0;

            let feeStudentQb = this.studentRepository.createQueryBuilder('student')
                .select(['student.id'])
                .where('student.isActive = :isActive', { isActive: true })
                .andWhere('(student.tenantId = :tenantId OR student.tenantId IS NULL)', { tenantId });

            if (isValidSection) {
                feeStudentQb = feeStudentQb.leftJoin('student.class', 'feeClass')
                    .andWhere('feeClass.schoolSectionId = :sectionId', { sectionId });
            }

            const feeStudents = await feeStudentQb.getMany();

            // Fetch session name once here — avoids N repeated lookups inside getStudentFeeSnapshot.
            let sessionNameForSnapshot: string | null = null;
            if (isValidSession) {
                const sessionRow = await this.studentRepository.manager.query(
                    `SELECT name FROM academic_sessions WHERE id::text = $1::text LIMIT 1`,
                    [sessionId],
                );
                sessionNameForSnapshot = sessionRow?.[0]?.name || null;
            }

            const feeSnapshots = await Promise.all(
                feeStudents.map((student) => this.getStudentFeeSnapshot(
                    student.id,
                    tenantId,
                    isValidSession ? sessionId : undefined,
                    sessionNameForSnapshot,
                )),
            );

            const billableSnapshots = feeSnapshots.filter(
                (snapshot) => snapshot.totalDue > 0 || snapshot.totalPaid > 0 || snapshot.hasAssignments || snapshot.hasCarryForwards,
            );

            stats.feesOverview.paid = billableSnapshots.filter(
                (snapshot) => snapshot.totalDue > 0 && snapshot.balance <= 0.01,
            ).length;
            stats.feesOverview.partial = billableSnapshots.filter(
                (snapshot) => snapshot.balance > 0.01 && snapshot.totalPaid > 0.01,
            ).length;
            stats.feesOverview.unpaid = billableSnapshots.filter(
                (snapshot) => snapshot.balance > 0.01 && snapshot.totalPaid <= 0.01,
            ).length;
            stats.finance.outstandingFees = billableSnapshots.reduce((sum, snapshot) => sum + snapshot.balance, 0);
        } catch (e) {
            console.error('[Dashboard] Error fetching finance stats', (e as any).message);
        }

        // --- SECTION 5: PERFORMANCE ---
        try {
            const performanceResults = await this.studentRepository.manager.query(`
                SELECT AVG(r."averageScore"::numeric) as "avgScore"
                FROM student_term_results r
                JOIN exam_groups eg ON eg.id::text = r."examGroupId"::text
                LEFT JOIN classes cls ON cls.id::text = r."classId"::text
                WHERE (r."tenantId" = $1 OR r."tenantId" IS NULL)
                  AND eg."isPublished" = true
                  ${isValidSection ? 'AND cls."schoolSectionId" = $2' : ''}
                  ${isValidSession ? `AND eg."sessionId"::text = ${isValidSection ? '$3::text' : '$2::text'}` : ''}
            `, isValidSection && isValidSession ? [tenantId, sectionId, sessionId] : (isValidSection || isValidSession ? [tenantId, sectionId || sessionId] : [tenantId]));

            stats.studentPerformance.schoolWideAverage = parseFloat(performanceResults[0]?.avgScore || '0').toFixed(1);
        } catch (e) {
            console.error('[Dashboard] Error fetching performance stats', (e as any).message);
        }

        try {
            const riskCount = await this.studentRepository.manager.query(`
                WITH published_results AS (
                    SELECT
                        r."studentId" as "studentId",
                        AVG(r."averageScore"::numeric) as "avgScore"
                    FROM student_term_results r
                    JOIN exam_groups eg ON eg.id::text = r."examGroupId"::text
                    LEFT JOIN classes cls ON cls.id::text = r."classId"::text
                    WHERE (r."tenantId" = $1 OR r."tenantId" IS NULL)
                      AND eg."isPublished" = true
                      ${isValidSection ? 'AND cls."schoolSectionId" = $2' : ''}
                      ${isValidSession ? `AND eg."sessionId"::text = ${isValidSection ? '$3::text' : '$2::text'}` : ''}
                    GROUP BY r."studentId"
                ),
                attendance_rates AS (
                    SELECT
                        sa."studentId" as "studentId",
                        ((COUNT(sa.id) FILTER (WHERE LOWER(sa.status::text) = 'present'))::float / NULLIF(COUNT(sa.id), 0)::float) * 100 as "attendanceRate"
                    FROM student_attendance sa
                    LEFT JOIN classes cls ON cls.id::text = sa."classId"::text
                    WHERE (sa."tenantId" = $1 OR sa."tenantId" IS NULL)
                      ${isValidSection ? 'AND cls."schoolSectionId" = $2' : ''}
                      ${isValidSession ? `AND sa."sessionId"::text = ${isValidSection ? '$3::text' : '$2::text'}` : ''}
                    GROUP BY sa."studentId"
                )
                SELECT COUNT(*)::int as count
                FROM published_results pr
                LEFT JOIN attendance_rates ar ON ar."studentId"::text = pr."studentId"::text
                WHERE pr."avgScore" < 45
                  AND COALESCE(ar."attendanceRate", 100) < 65
            `, isValidSection && isValidSession ? [tenantId, sectionId, sessionId] : (isValidSection || isValidSession ? [tenantId, sectionId || sessionId] : [tenantId]));

            stats.studentPerformance.studentsAtRisk = parseInt(riskCount[0]?.count || '0', 10) || 0;
        } catch (e) {
            console.error('[Dashboard] Error fetching risk stats', (e as any).message);
        }

        try {
            const runTopSubjectQuery = async (publishedOnly: boolean) => {
                const params: any[] = [tenantId];
                let sql = `
                    SELECT sub.name as name, AVG(res.score::numeric) as "avgScore"
                    FROM exam_results res
                    LEFT JOIN exams ex ON ex.id::text = res."examId"::text
                    LEFT JOIN exam_groups eg ON eg.id::text = COALESCE(res."examGroupId"::text, ex."examGroupId"::text)
                    JOIN subjects sub ON sub.id::text = COALESCE(res."subjectId"::text, ex."subjectId"::text)
                    LEFT JOIN classes cls ON cls.id::text = COALESCE(res."classId"::text, ex."classId"::text)
                    WHERE (res."tenantId" = $1 OR res."tenantId" IS NULL)
                      AND res.score IS NOT NULL
                `;

                if (publishedOnly) {
                    sql += ` AND eg."isPublished" = true `;
                }

                if (isValidSection) {
                    params.push(sectionId);
                    sql += ` AND cls."schoolSectionId" = $${params.length} `;
                }

                if (isValidSession) {
                    params.push(sessionId);
                    sql += ` AND (
                        res."sessionId"::text = $${params.length}::text
                        OR ex."sessionId"::text = $${params.length}::text
                        OR eg."sessionId"::text = $${params.length}::text
                        OR (res."sessionId" IS NULL AND ex."sessionId" IS NULL AND eg."sessionId" IS NULL)
                    ) `;
                }

                sql += `
                    GROUP BY sub.name
                    ORDER BY "avgScore" DESC
                    LIMIT 1
                `;

                const rows = await this.examResultRepository.manager.query(sql, params);
                return rows?.[0];
            };

            let topSubject = await runTopSubjectQuery(true);

            // Fallback to all result rows if published-only yields no row.
            if (!topSubject) {
                topSubject = await runTopSubjectQuery(false);
            }

            // Final fallback: use exam-level averages if result rows are sparse.
            if (!topSubject) {
                const examAvgRows = await this.examResultRepository.manager.query(`
                    SELECT sub.name as name, AVG(ex."averageScore"::numeric) as "avgScore"
                    FROM exams ex
                    JOIN subjects sub ON sub.id::text = ex."subjectId"::text
                    LEFT JOIN exam_groups eg ON eg.id::text = ex."examGroupId"::text
                    LEFT JOIN classes cls ON cls.id::text = ex."classId"::text
                    WHERE (ex."tenantId" = $1 OR ex."tenantId" IS NULL)
                      AND ex."averageScore" IS NOT NULL
                      ${isValidSection ? 'AND cls."schoolSectionId" = $2' : ''}
                      ${isValidSession ? `AND (ex."sessionId"::text = ${isValidSection ? '$3::text' : '$2::text'} OR eg."sessionId"::text = ${isValidSection ? '$3::text' : '$2::text'} OR (ex."sessionId" IS NULL AND eg."sessionId" IS NULL))` : ''}
                    GROUP BY sub.name
                    ORDER BY "avgScore" DESC
                    LIMIT 1
                `, isValidSection && isValidSession ? [tenantId, sectionId, sessionId] : (isValidSection || isValidSession ? [tenantId, sectionId || sessionId] : [tenantId]));
                topSubject = examAvgRows?.[0];
            }

            // Last fallback: if active filters are too restrictive, compute school-wide.
            if (!topSubject && (isValidSection || isValidSession)) {
                const schoolWideRows = await this.examResultRepository.manager.query(`
                    SELECT sub.name as name, AVG(res.score::numeric) as "avgScore"
                    FROM exam_results res
                    LEFT JOIN exams ex ON ex.id::text = res."examId"::text
                    JOIN subjects sub ON sub.id::text = COALESCE(res."subjectId"::text, ex."subjectId"::text)
                    WHERE (res."tenantId" = $1 OR res."tenantId" IS NULL)
                      AND res.score IS NOT NULL
                    GROUP BY sub.name
                    ORDER BY "avgScore" DESC
                    LIMIT 1
                `, [tenantId]);
                topSubject = schoolWideRows?.[0];
            }
            stats.academicHealth.topPerformingSubject = topSubject?.name || 'N/A';
        } catch (e) {
            console.error('[Dashboard] Error fetching top performing subject', (e as any).message);
        }

        try {
            let classPerfRaw = await this.studentRepository.manager.query(`
                SELECT
                    c.name as name,
                    AVG(r."averageScore"::numeric) as "avgScore"
                FROM student_term_results r
                JOIN exam_groups eg ON eg.id::text = r."examGroupId"::text
                JOIN classes c ON c.id::text = r."classId"::text
                WHERE (r."tenantId" = $1 OR r."tenantId" IS NULL)
                  AND eg."isPublished" = true
                  ${isValidSection ? 'AND c."schoolSectionId" = $2' : ''}
                  ${isValidSession ? `AND eg."sessionId"::text = ${isValidSection ? '$3::text' : '$2::text'}` : ''}
                GROUP BY c.name
                ORDER BY "avgScore" DESC
            `, isValidSection && isValidSession ? [tenantId, sectionId, sessionId] : (isValidSection || isValidSession ? [tenantId, sectionId || sessionId] : [tenantId]));

            if ((!classPerfRaw || classPerfRaw.length === 0) && isValidSession) {
                classPerfRaw = await this.studentRepository.manager.query(`
                    SELECT
                        c.name as name,
                        AVG(r."averageScore"::numeric) as "avgScore"
                    FROM student_term_results r
                    JOIN exam_groups eg ON eg.id::text = r."examGroupId"::text
                    JOIN classes c ON c.id::text = r."classId"::text
                    WHERE (r."tenantId" = $1 OR r."tenantId" IS NULL)
                      AND eg."isPublished" = true
                      ${isValidSection ? 'AND c."schoolSectionId" = $2' : ''}
                    GROUP BY c.name
                    ORDER BY "avgScore" DESC
                `, isValidSection ? [tenantId, sectionId] : [tenantId]);
            }

            if (classPerfRaw.length > 0) {
                stats.studentPerformance.topPerformingClasses = classPerfRaw.slice(0, 3).map((r: any) => r.name);
                stats.studentPerformance.bottomPerformingClasses = classPerfRaw.length > 3
                    ? [...classPerfRaw].slice(-3).reverse().map((r: any) => r.name)
                    : [];
            }
        } catch (e) {
            console.error('[Dashboard] Error fetching class performance', (e as any).message);
        }

        try {
            const lowAttRaw = await this.studentAttendanceRepository.createQueryBuilder('sa')
                .select('c.name', 'name')
                .addSelect('(COUNT(sa.id) FILTER (WHERE sa.status = \'present\')::float / NULLIF(COUNT(sa.id), 0)::float) * 100', 'rate')
                .innerJoin('classes', 'c', 'c.id::text = "sa"."classId"::text')
                .where('(sa.tenantId = :tenantId OR sa.tenantId IS NULL)', { tenantId })
                .andWhere(isValidSession ? '"sa"."sessionId"::text = CAST(:sessionId AS text)' : '1=1', { sessionId })
                .groupBy('c.name')
                .having('(COUNT(sa.id) FILTER (WHERE sa.status = \'present\')::float / NULLIF(COUNT(sa.id), 0)::float) * 100 < 75')
                .limit(5)
                .getRawMany();
            stats.academicHealth.lowAttendanceClasses = lowAttRaw.map(r => r.name);
        } catch (e) {
            console.error('[Dashboard] Error fetching attendance alerts', (e as any).message);
        }

        // --- SECTION 6: OTHERS ---
        try {
            // Count publication by CLASS (aligned with Result Management workflow).
            // A class is considered published once it has at least one PUBLISHED term result
            // for the current filter scope.
            let classStatusQb = this.studentTermResultRepository
                .createQueryBuilder('tr')
                .leftJoin('exam_groups', 'eg', 'eg.id::text = tr."examGroupId"::text')
                .select('tr."classId"', 'classId')
                .addSelect(`SUM(CASE WHEN UPPER(COALESCE(tr.status, '')) = 'PUBLISHED' THEN 1 ELSE 0 END)`, 'publishedCount')
                .addSelect(`SUM(CASE WHEN UPPER(COALESCE(tr.status, '')) IN ('DRAFT','APPROVED','WITHHELD') THEN 1 ELSE 0 END)`, 'pendingCount')
                .addSelect(`MAX(CASE WHEN eg."isPublished" = true THEN 1 ELSE 0 END)`, 'groupPublished')
                .where('(tr."tenantId" = :tenantId OR tr."tenantId" IS NULL)', { tenantId })
                .andWhere('tr."classId" IS NOT NULL');

            if (isValidSection) {
                classStatusQb = classStatusQb
                    .leftJoin('classes', 'cls', 'cls.id::text = tr."classId"::text')
                    .andWhere('cls."schoolSectionId" = :sectionId', { sectionId });
            }

            if (isValidSession) {
                classStatusQb = classStatusQb.andWhere(
                    '(tr."sessionId"::text = CAST(:sessionId AS text) OR eg."sessionId"::text = CAST(:sessionId AS text) OR (tr."sessionId" IS NULL AND eg."sessionId" IS NULL))',
                    { sessionId }
                );
            }

            // Intentionally skip strict term filter to align with Result Management visibility
            // and avoid suppressing data due to term-name mismatches.

            let classStatusRows = await classStatusQb.groupBy('tr."classId"').getRawMany();
            // Fallback for legacy data where session was not persisted consistently.
            if (isValidSession && classStatusRows.length === 0) {
                classStatusRows = await this.studentTermResultRepository
                    .createQueryBuilder('tr')
                    .leftJoin('exam_groups', 'eg', 'eg.id::text = tr."examGroupId"::text')
                    .select('tr."classId"', 'classId')
                    .addSelect(`SUM(CASE WHEN UPPER(COALESCE(tr.status, '')) = 'PUBLISHED' THEN 1 ELSE 0 END)`, 'publishedCount')
                    .addSelect(`MAX(CASE WHEN eg."isPublished" = true THEN 1 ELSE 0 END)`, 'groupPublished')
                    .where('(tr."tenantId" = :tenantId OR tr."tenantId" IS NULL)', { tenantId })
                    .andWhere('tr."classId" IS NOT NULL')
                    .groupBy('tr."classId"')
                    .getRawMany();
            }

            const publishedClasses = classStatusRows.filter((row: any) =>
                Number(row.publishedCount || 0) > 0 || Number(row.groupPublished || 0) > 0
            ).length;
            const totalClasses = stats.academics.totalClasses || 0;
            const pendingClasses = Math.max(0, totalClasses - publishedClasses);

            stats.academicHealth.publishedResultsCount = publishedClasses;
            stats.academicHealth.unpublishedResultsCount = pendingClasses;
        } catch (e) {
            console.error('[Dashboard] Error fetching result counts', (e as any).message);
        }

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const sessionDateRange = isValidSession ? await this.getSessionDateRange(sessionId) : null;
            const canFilterPayrollBySession = Boolean(sessionDateRange?.startDate && sessionDateRange?.endDate);

            // Staff present from staff attendance (counting Present/Late/Half-Day as present)
            let presentQb = this.staffAttendanceRepository.createQueryBuilder('att')
                .leftJoin('staff', 'staff', 'staff.id::text = att.staff_id::text')
                .where('att.date = :today', { today })
                .andWhere('(staff.tenantId = :tenantId OR staff.tenantId IS NULL)', { tenantId })
                .andWhere('staff.status = :status', { status: StaffStatus.ACTIVE })
                .andWhere(`LOWER(COALESCE(att.status::text, '')) IN ('present','late','half-day','half day','half_day')`);

            if (isValidSection) {
                presentQb = presentQb
                    .leftJoin('staff_school_sections', 'ss', 'ss."staffId"::text = staff.id::text')
                    .andWhere('ss."schoolSectionId" = :sectionId', { sectionId });
            }

            if (isValidSession) {
                presentQb = presentQb.andWhere('(att.session_id = :sessionId OR att.session_id IS NULL)', { sessionId });
            }

            const presentCountRaw = await presentQb
                .select('COUNT(DISTINCT att.staff_id)', 'count')
                .getRawOne();
            stats.academicHealth.staffPresentToday = parseInt(presentCountRaw?.count || '0', 10) || 0;

            // Fallback: if today has no attendance, use latest attendance date with records.
            if (stats.academicHealth.staffPresentToday === 0) {
                let latestDateQb = this.staffAttendanceRepository.createQueryBuilder('att')
                    .leftJoin('staff', 'staff', 'staff.id::text = att.staff_id::text')
                    .where('(staff.tenantId = :tenantId OR staff.tenantId IS NULL)', { tenantId })
                    .andWhere('staff.status = :status', { status: StaffStatus.ACTIVE });

                if (isValidSection) {
                    latestDateQb = latestDateQb
                        .leftJoin('staff_school_sections', 'ss', 'ss."staffId"::text = staff.id::text')
                        .andWhere('ss."schoolSectionId" = :sectionId', { sectionId });
                }

                if (isValidSession) {
                    latestDateQb = latestDateQb.andWhere('(att.session_id = :sessionId OR att.session_id IS NULL)', { sessionId });
                }

                const latestDateRaw = await latestDateQb
                    .select('MAX(att.date)', 'latestDate')
                    .getRawOne();

                if (latestDateRaw?.latestDate) {
                    let latestPresentQb = this.staffAttendanceRepository.createQueryBuilder('att')
                        .leftJoin('staff', 'staff', 'staff.id::text = att.staff_id::text')
                        .where('att.date = :latestDate', { latestDate: latestDateRaw.latestDate })
                        .andWhere('(staff.tenantId = :tenantId OR staff.tenantId IS NULL)', { tenantId })
                        .andWhere('staff.status = :status', { status: StaffStatus.ACTIVE })
                        .andWhere(`LOWER(COALESCE(att.status::text, '')) IN ('present','late','half-day','half day','half_day')`);

                    if (isValidSection) {
                        latestPresentQb = latestPresentQb
                            .leftJoin('staff_school_sections', 'ss', 'ss."staffId"::text = staff.id::text')
                            .andWhere('ss."schoolSectionId" = :sectionId', { sectionId });
                    }

                    if (isValidSession) {
                        latestPresentQb = latestPresentQb.andWhere('(att.session_id = :sessionId OR att.session_id IS NULL)', { sessionId });
                    }

                    const latestPresentRaw = await latestPresentQb
                        .select('COUNT(DISTINCT att.staff_id)', 'count')
                        .getRawOne();
                    stats.academicHealth.staffPresentToday = parseInt(latestPresentRaw?.count || '0', 10) || 0;
                }
            }

            stats.academicHealth.teachersYetToSubmit = await this.staffRepository.createQueryBuilder('staff')
                .leftJoin('staff.roleObject', 'role')
                .leftJoin('staff_attendance', 'att', 'att.staff_id = staff.id AND att.date = :today', { today })
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
                .andWhere(canFilterPayrollBySession
                    ? 'MAKE_DATE(p.year, p.month, 1) BETWEEN :sessionStartDate AND :sessionEndDate'
                    : 'p.month = :currentMonth AND p.year = :currentYear', canFilterPayrollBySession
                    ? {
                        sessionStartDate: sessionDateRange?.startDate,
                        sessionEndDate: sessionDateRange?.endDate,
                    }
                    : { currentMonth, currentYear })
                .andWhere(isValidSection
                    ? new Brackets((qb) => {
                        qb.where('p."school_section_id"::text = CAST(:sectionId AS text)', { sectionId })
                            .orWhere(`p."school_section_id" IS NULL AND EXISTS (
                                SELECT 1
                                FROM "staff_school_sections" sss
                                WHERE sss."staffId"::text = staff.id::text
                                  AND sss."schoolSectionId"::text = CAST(:sectionId AS text)
                            )`, { sectionId });
                    })
                    : '1=1')
                .groupBy('p.status')
                .getRawMany();

            const payrollTotal = payrollSummary.reduce((acc, curr) => acc + parseFloat(curr.total || '0'), 0);
            stats.accounting.payrollStatus = payrollSummary.length > 0 ? payrollSummary[0].status : 'Pending';

            const expenseSummary = await this.studentRepository.manager.query(`
                SELECT COALESCE(SUM(e.amount::numeric), 0) as total
                FROM expenses e
                WHERE e."isActive" = true
                  AND (e."tenantId" = $1 OR e."tenantId" IS NULL)
                  AND e.status IN ('APPROVED', 'PAID')
                  ${isValidSection ? 'AND e."schoolSectionId"::text = $2::text' : ''}
                  ${isValidSession ? `AND e."sessionId"::text = ${isValidSection ? '$3::text' : '$2::text'}` : ''}
            `, isValidSection && isValidSession ? [tenantId, sectionId, sessionId] : (isValidSection || isValidSession ? [tenantId, sectionId || sessionId] : [tenantId]));

            const latestExpenseRows = await this.studentRepository.manager.query(`
                SELECT
                    COALESCE(ec.name, e.title, 'Uncategorized') as category,
                    e.amount::numeric as amount
                FROM expenses e
                LEFT JOIN expense_categories ec ON ec.id::text = e."categoryId"::text
                WHERE e."isActive" = true
                  AND (e."tenantId" = $1 OR e."tenantId" IS NULL)
                  AND e.status IN ('APPROVED', 'PAID')
                  ${isValidSection ? 'AND e."schoolSectionId"::text = $2::text' : ''}
                  ${isValidSession ? `AND e."sessionId"::text = ${isValidSection ? '$3::text' : '$2::text'}` : ''}
                ORDER BY e."expenseDate" DESC, e."createdAt" DESC
                LIMIT 1
            `, isValidSection && isValidSession ? [tenantId, sectionId, sessionId] : (isValidSection || isValidSession ? [tenantId, sectionId || sessionId] : [tenantId]));

            const expenseTotal = parseFloat(expenseSummary?.[0]?.total || '0') || 0;

            stats.accounting.totalExpenses = payrollTotal + expenseTotal;
            stats.accounting.netBalance = stats.finance.totalRevenue - stats.accounting.totalExpenses;
            stats.accounting.latestExpense = latestExpenseRows?.[0]
                ? {
                    category: latestExpenseRows[0].category || 'Uncategorized',
                    amount: parseFloat(latestExpenseRows[0].amount || '0') || 0,
                }
                : {
                    category: payrollTotal > 0 ? 'Payroll' : 'N/A',
                    amount: payrollTotal > 0 ? payrollTotal : 0,
                };
        } catch (e) {
            console.error('[Dashboard] Error fetching auxiliary stats', (e as any).message);
        }

        return stats;
    }

    async getAdminCharts(tenantIdInput: string, sectionId?: string, sessionId?: string, termId?: string) {
        try {
            const tenantId = await this.findCorrectTenantId(tenantIdInput);
            const isValidSection = sectionId && sectionId !== 'undefined' && sectionId !== 'null' && sectionId !== '';
            const isValidSession = sessionId && sessionId !== 'undefined' && sessionId !== 'null' && sessionId !== '';

            let maleQb = this.studentRepository.createQueryBuilder('student').where('(student.tenantId = :tenantId OR student.tenantId IS NULL)', { tenantId }).andWhere('student.gender = :gender', { gender: 'Male' });
            let femaleQb = this.studentRepository.createQueryBuilder('student').where('(student.tenantId = :tenantId OR student.tenantId IS NULL)', { tenantId }).andWhere('student.gender = :gender', { gender: 'Female' });
            let enrollQb = this.studentRepository.createQueryBuilder('student').where('(student.tenantId = :tenantId OR student.tenantId IS NULL)', { tenantId });

            if (isValidSection) {
                maleQb.leftJoin('student.class', 'cls1').andWhere('cls1.schoolSectionId = :sectionId', { sectionId });
                femaleQb.leftJoin('student.class', 'cls2').andWhere('cls2.schoolSectionId = :sectionId', { sectionId });
                enrollQb.leftJoin('student.class', 'cls3').andWhere('cls3.schoolSectionId = :sectionId', { sectionId });
            }

            if (isValidSession) {
                // Enrollment trend for specific session - filter student.createdAt by session dates if available
                // for now we filter by student.sessionId if it exists (assuming we add it)
                // but usually students are admitted during a year. Let's just keep the trend general 
                // OR filter by the session ID if the student record has it.
                // studentQb.andWhere('student.sessionId = :sessionId', { sessionId });
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

    async getRecentActivities(tenantIdInput: string, sectionId?: string, sessionId?: string, termId?: string) {
        try {
            const tenantId = await this.findCorrectTenantId(tenantIdInput);
            const isValidSection = sectionId && sectionId !== 'undefined' && sectionId !== 'null' && sectionId !== '';
            const isValidSession = sessionId && sessionId !== 'undefined' && sessionId !== 'null' && sessionId !== '';

            let studQb = this.studentRepository.createQueryBuilder('student').where('(student.tenantId = :tenantId OR student.tenantId IS NULL)', { tenantId }).orderBy('student.createdAt', 'DESC').take(5);
            let transQb = this.transactionRepository.createQueryBuilder('transaction').where('(transaction.tenantId = :tenantId OR transaction.tenantId IS NULL)', { tenantId }).andWhere('transaction.type = :type', { type: TransactionType.FEE_PAYMENT }).orderBy('transaction.createdAt', 'DESC').take(5);

            if (isValidSection) {
                studQb.leftJoin('student.class', 'cls').andWhere('cls.schoolSectionId = :sectionId', { sectionId });
                transQb.andWhere('"transaction"."schoolSectionId" = :sectionId', { sectionId });
            }
            if (isValidSession) {
                transQb.andWhere('"transaction"."sessionId"::text = CAST(:sessionId AS text)', { sessionId });
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

    async getStudentDashboardStats(studentId: string, tenantIdInput: string, user?: any, sessionId?: string, termId?: string) {
        const tenantId = await this.findCorrectTenantId(tenantIdInput);
        const isValidSession = sessionId && sessionId !== 'undefined' && sessionId !== 'null' && sessionId !== '';
        console.log(`[DashboardService] StudentStats: studentId: ${studentId}, sessionId: ${sessionId}, termId: ${termId}`);
        
        // --- Security Check for Parents ---
        if (user && (user.role || '').toLowerCase() === 'parent') {
           const hasAccess = await this.studentRepository.manager.query(`
               SELECT 1 FROM students s 
               JOIN parents p ON p.id = s."parentId" 
               WHERE p."userId" = $1 AND s.id = $2 AND s."tenantId" = $3
           `, [user.id, studentId, tenantId]);
           
           if (!hasAccess || hasAccess.length === 0) {
              const { ForbiddenException } = require('@nestjs/common');
              throw new ForbiddenException('You can only view your own children\'s dashboard data.');
           }
        }
        // ----------------------------------
        
        // Ensure student exists and get basic info
        const student = await this.studentRepository.findOne({
            where: { id: studentId, tenantId },
            relations: ['class']
        });
        
        if (!student) {
            throw new NotFoundException('Student not found');
        }

        const classId = student.classId;

        let attendancePercentage: number | null = null;
        let feesBalance = 0;
        let latestAverage = 0;
        let latestAverageTerm = 'No Assessments Yet';
        let nextExamTitle = 'None Upcoming';
        let nextExamDate: string | null = null;
        let todayClasses = [];
        let announcements: any[] = [];
        let performanceTrend: any[] = [];
        let pendingAssignments: any[] = [];
        let liveClasses: any[] = [];

        // Extended Dashboards Queries
        try {
            performanceTrend = await this.studentRepository.manager.query(`
                SELECT r."averageScore" as score, eg.name as term
                FROM student_term_results r
                JOIN exam_groups eg ON eg.id = r."examGroupId"
                WHERE r."studentId" = $1 AND eg."isPublished" = true
                  ${isValidSession ? 'AND eg."sessionId" = $2' : ''}
                ORDER BY r."createdAt" ASC
                LIMIT 4
            `, isValidSession ? [studentId, sessionId] : [studentId]);

            pendingAssignments = await this.studentRepository.manager.query(`
                SELECT h.id, h.title, h."dueDate", s.name as subject
                FROM homework h
                JOIN subjects s ON s.id = h."subjectId"
                LEFT JOIN homework_submissions sub ON sub."homeworkId" = h.id AND sub."studentId" = $1
                WHERE h."classId" = $2 
                  AND (sub.id IS NULL OR sub.status = 'PENDING')
                  AND h."dueDate" >= $3
                ORDER BY h."dueDate" ASC
                LIMIT 4
            `, [studentId, classId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)]);

            liveClasses = await this.studentRepository.manager.query(`
                SELECT oc.id, oc.title, oc."meetingUrl", oc.platform, oc."startTime", s.name as subject
                FROM online_classes oc
                JOIN subjects s ON s.id = oc."subjectId"
                WHERE oc."classId" = $1 
                  AND oc.status IN ('SCHEDULED', 'IN_PROGRESS')
                  AND oc."startTime" <= $2
                  AND oc."endTime" >= $3
            `, [classId, new Date(Date.now() + 15 * 60 * 1000), new Date(Date.now() - 60 * 60 * 1000)]);
        } catch (e) {
            console.error('Error fetching extended dashboard stats', e);
        }

        // 1. Attendance Percentage
        try {
            const attQb = await this.studentAttendanceRepository.createQueryBuilder('att')
                .select('COUNT(*) FILTER (WHERE att.status = \'present\')::float / NULLIF(COUNT(*), 0)::float * 100', 'rate')
                .where('att.studentId = :studentId', { studentId })
                .andWhere('(att.tenantId = :tenantId OR att.tenantId IS NULL)', { tenantId });
            
            if (isValidSession) {
                attQb.andWhere('att.sessionId = :sessionId', { sessionId });
            }
            
            const result = await attQb.getRawOne();
            if (result && result.rate !== null) {
                attendancePercentage = parseFloat(result.rate);
            }
        } catch (e) { console.error(e) }

        // 2. Fees Balance
        try {
            const feeStatusRaw = await this.studentRepository.manager.query(`
                SELECT 
                    (
                        SELECT COALESCE(SUM(fh."defaultAmount"::numeric), 0)
                        FROM students s
                        LEFT JOIN fee_assignments fa ON fa."studentId"::text = s.id::text 
                            AND (fa."tenantId"::text = $1::text OR fa."tenantId" IS NULL)
                            AND fa."isActive" = true
                            ${isValidSession ? 'AND fa."sessionId"::text = $3::text' : ''}
                        LEFT JOIN fee_group_heads fgh ON fgh."feeGroupId"::text = fa."feeGroupId"::text
                        LEFT JOIN fee_heads fh ON fh.id::text = fgh."feeHeadId"::text
                        WHERE s.id = $2
                    ) + (
                        SELECT COALESCE(SUM(amount::numeric), 0)
                        FROM carry_forwards
                        WHERE "studentId"::text = $2::text AND ("tenantId"::text = $1::text OR "tenantId" IS NULL)
                        ${isValidSession ? 'AND ("sessionId"::text = $3::text OR ("sessionId" IS NULL AND "academicYear" = (SELECT name FROM academic_sessions WHERE id::text = $3::text)))' : ''}
                    ) as assigned,
                    (
                        SELECT COALESCE(SUM(amount::numeric), 0)
                        FROM transactions
                        WHERE type = 'FEE_PAYMENT' AND "studentId"::text = $2::text AND ("tenantId"::text = $1::text OR "tenantId" IS NULL)
                        ${isValidSession ? 'AND "sessionId"::text = $3::text' : ''}
                    ) as paid
            `, isValidSession ? [tenantId, studentId, sessionId] : [tenantId, studentId]);

            if (feeStatusRaw && feeStatusRaw[0]) {
                const assigned = parseFloat(feeStatusRaw[0].assigned || '0');
                const paid = parseFloat(feeStatusRaw[0].paid || '0');
                feesBalance = Math.max(0, assigned - paid);
            }
        } catch (e) { console.error('[DashboardService] Student balance error:', (e as any).message) }

        // 3. Latest Average
        try {
            // Get latest published result average score for this specific session if provided
            const latestResult = await this.studentRepository.manager.query(`
                SELECT r."averageScore" as "averageScore", eg.name as "examName"
                FROM student_term_results r
                JOIN exam_groups eg ON eg.id = r."examGroupId"
                WHERE r."studentId" = $1 AND eg."isPublished" = true
                ${isValidSession ? 'AND eg."sessionId" = $2' : ''}
                ORDER BY r."createdAt" DESC
                LIMIT 1
            `, isValidSession ? [studentId, sessionId] : [studentId]);
            
            if (latestResult && latestResult[0]) {
                if (latestResult[0].averageScore) latestAverage = parseFloat(latestResult[0].averageScore);
                if (latestResult[0].examName) latestAverageTerm = latestResult[0].examName;
            }
        } catch (e) { console.error(e) }

        // 4. Next Exam
        try {
            if (classId) {
                const now = new Date();
                const upcomingExam = await this.studentRepository.manager.query(`
                    SELECT s.date, s."startTime", e.name
                    FROM exam_schedules s
                    JOIN exams e ON e.id = s."examId"
                    JOIN exam_groups eg ON eg.id = e."examGroupId"
                    WHERE e."classId" = $1 AND s.date >= $2
                    ${isValidSession ? 'AND eg."sessionId" = $3' : ''}
                    ORDER BY s.date ASC, s."startTime" ASC
                    LIMIT 1
                `, isValidSession ? [classId, now, sessionId] : [classId, now]);

                if (upcomingExam && upcomingExam[0]) {
                    nextExamTitle = upcomingExam[0].name;
                    
                    const examDate = new Date(upcomingExam[0].date);
                    const isTomorrow = examDate.getDate() === now.getDate() + 1 && examDate.getMonth() === now.getMonth();
                    const isToday = examDate.getDate() === now.getDate() && examDate.getMonth() === now.getMonth();
                    
                    let datePart = examDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    if (isToday) datePart = 'Today';
                    if (isTomorrow) datePart = 'Tomorrow';

                    const timePart = upcomingExam[0].startTime || '';
                    nextExamDate = timePart ? `${datePart}, ${timePart.substring(0,5)}` : datePart;
                }
            }
        } catch (e) { console.error(e) }

        // 5. Today's Classes
        try {
            if (classId) {
                let dayOfWeek = new Date().getDay();
                const dow = dayOfWeek === 0 ? 7 : dayOfWeek; 

                todayClasses = await this.studentRepository.manager.query(`
                    SELECT 
                        ts.id,
                        tp."startTime" as time,
                        s.name as subject,
                        st."first_name" || ' ' || COALESCE(st."last_name", '') as teacher
                    FROM timetables ts
                    JOIN timetable_periods tp ON tp.id = ts."periodId"
                    JOIN subjects s ON s.id = ts."subjectId"
                    LEFT JOIN staff st ON st.id = COALESCE(ts."teacherId", (
                        SELECT "teacherId" 
                        FROM subject_teachers 
                        WHERE "classId" = ts."classId" 
                          AND "subjectId" = ts."subjectId" 
                        LIMIT 1
                    ))
                    WHERE ts."classId" = $1 AND ts."dayOfWeek" = $2
                    ORDER BY tp."periodOrder" ASC
                `, [classId, dow]);
            }
        } catch (e) { console.error(e) }

        // 6. Announcements (Noticeboard)
        try {
            const now = new Date();
            announcements = await this.studentRepository.manager.query(`
                SELECT id, title, type, "created_at" as date
                FROM notices
                WHERE "isActive" = true 
                  AND ("targetAudience" = 'All' OR "targetAudience" = 'Students')
                  AND ("expiresAt" IS NULL OR "expiresAt" > $1)
                  AND ("tenantId" = $2 OR "tenantId" IS NULL)
                ORDER BY "created_at" DESC
                LIMIT 5
            `, [now, tenantId]);
        } catch (e) { console.error(e) }

        return {
            stats: {
                attendance: attendancePercentage !== null ? Math.round(attendancePercentage) : null,
                feesBalance,
                latestAverage: Math.round(latestAverage * 10) / 10,
                latestAverageTerm,
                nextExam: nextExamTitle,
                nextExamDate
            },
            performanceTrend,
            pendingAssignments,
            liveClasses,
            todayClasses,
            announcements: announcements.map((a: any) => ({
                date: new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                title: a.title,
                type: a.type === 'Emergency' ? 'warning' : 'info'
            }))
        };
    }

    async getParentDashboardOverview(userId: string, tenantIdInput: string, sessionId?: string) {
        const isValidSession = sessionId && sessionId !== 'undefined' && sessionId !== 'null' && sessionId !== '';

        // 1. Fetch children — look up via parent-user link WITHOUT strict tenantId filter.
        //    Each child carries its own tenantId which we use for their balance queries.
        const children = await this.studentRepository.manager.query(`
            SELECT s.id, s."firstName", s."lastName", s."tenantId",
                   s."admissionNo", c.name as "className", sec.name as "sectionName",
                   s."studentPhoto" as "photo"
            FROM students s
            JOIN parents p ON p.id = s."parentId"
            LEFT JOIN classes c ON c.id = s."classId"
            LEFT JOIN sections sec ON sec.id = s."sectionId"
            WHERE p."userId" = $1 AND s."isActive" = true
        `, [userId]);

        // Derive tenant from first child found (or fall back to token's tenant)
        const tenantId = children.length > 0 ? children[0].tenantId : (await this.findCorrectTenantId(tenantIdInput));

        let totalFamilyBalance = 0;
        const childrenWithStats = [];

        // 2. Aggregate stats for each child
        for (const child of children) {
            let attendance = 0;
            let balance = 0;
            let latestAverage = 0;

            const childId = child.id;

            // Attendance
            try {
                const attQb = await this.studentAttendanceRepository.createQueryBuilder('att')
                    .select('COUNT(*) FILTER (WHERE att.status = \'present\')::float / NULLIF(COUNT(*), 0)::float * 100', 'rate')
                    .where('att.studentId = :childId', { childId })
                    .andWhere('(att.tenantId = :tenantId OR att.tenantId IS NULL)', { tenantId });
                if (isValidSession) attQb.andWhere('att.sessionId = :sessionId', { sessionId });
                const attRes = await attQb.getRawOne();
                attendance = attRes?.rate ? Math.round(parseFloat(attRes.rate)) : 0;
            } catch (e) { console.error(e) }

            // Balance
            try {
                const childTenantId = child.tenantId || tenantId;
                const feeStatusRaw = await this.studentRepository.manager.query(`
                    SELECT 
                        (
                            SELECT COALESCE(SUM(fh."defaultAmount"::numeric), 0)
                            FROM students s
                            LEFT JOIN fee_assignments fa ON fa."studentId"::text = s.id::text
                                AND (fa."tenantId"::text = $1::text OR fa."tenantId" IS NULL)
                                AND fa."isActive" = true
                                ${isValidSession ? 'AND fa."sessionId"::text = $3::text' : ''}
                            LEFT JOIN fee_group_heads fgh ON fgh."feeGroupId"::text = fa."feeGroupId"::text
                            LEFT JOIN fee_heads fh ON fh.id::text = fgh."feeHeadId"::text
                            WHERE s.id = $2
                        ) + (
                            SELECT COALESCE(SUM(amount::numeric), 0)
                            FROM carry_forwards
                            WHERE "studentId"::text = $2::text AND ("tenantId"::text = $1::text OR "tenantId" IS NULL)
                            ${isValidSession ? 'AND ("sessionId"::text = $3::text OR ("sessionId" IS NULL AND "academicYear" = (SELECT name FROM academic_sessions WHERE id::text = $3::text)))' : ''}
                        ) as assigned,
                        (
                            SELECT COALESCE(SUM(amount::numeric), 0)
                            FROM transactions
                            WHERE type = 'FEE_PAYMENT' AND "studentId"::text = $2::text AND ("tenantId"::text = $1::text OR "tenantId" IS NULL)
                            ${isValidSession ? 'AND "sessionId"::text = $3::text' : ''}
                        ) as paid
                `, isValidSession ? [childTenantId, childId, sessionId] : [childTenantId, childId]);

                if (feeStatusRaw && feeStatusRaw[0]) {
                    const assigned = parseFloat(feeStatusRaw[0].assigned || '0');
                    const paid = parseFloat(feeStatusRaw[0].paid || '0');
                    balance = Math.max(0, assigned - paid);
                    totalFamilyBalance += balance;
                }
            } catch (e) { console.error('[DashboardService] Parent balance error:', (e as any).message) }

            // Performance
            try {
                const perfRes = await this.studentRepository.manager.query(`
                    SELECT r."averageScore"
                    FROM student_term_results r
                    JOIN exam_groups eg ON eg.id = r."examGroupId"
                    WHERE r."studentId" = $1 AND eg."isPublished" = true
                    ${isValidSession ? 'AND eg."sessionId" = $2' : ''}
                    ORDER BY r."createdAt" DESC
                    LIMIT 1
                `, isValidSession ? [childId, sessionId] : [childId]);
                latestAverage = perfRes[0]?.averageScore ? Math.round(parseFloat(perfRes[0].averageScore)) : 0;
            } catch (e) { console.error(e) }

            childrenWithStats.push({
                ...child,
                photo: child.photo?.replace(/\\/g, '/'),
                attendance,
                balance,
                latestAverage
            });
        }

        // 3. Notices
        let notices = [];
        try {
            const now = new Date();
            notices = await this.studentRepository.manager.query(`
                SELECT id, title, type, "content", "created_at" as date
                FROM notices
                WHERE "isActive" = true 
                  AND "targetAudience" = 'All'
                  AND ("expiresAt" IS NULL OR "expiresAt" > $1)
                  AND ("tenantId" = $2 OR "tenantId" IS NULL)
                ORDER BY "created_at" DESC
                LIMIT 5
            `, [now, tenantId]);
        } catch (e) { console.error(e) }

        return {
            children: childrenWithStats,
            totalFamilyBalance,
            notices: notices.map((a: any) => ({
                id: a.id,
                title: a.title,
                content: a.content,
                type: a.type === 'Emergency' ? 'warning' : 'info',
                date: new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }))
        };
    }
}
