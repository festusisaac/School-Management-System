import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Staff } from '../../hr/entities/staff.entity';
import { Transaction, TransactionType } from '../../finance/entities/transaction.entity';
import { Class } from '../../academics/entities/class.entity';
import { Subject } from '../../academics/entities/subject.entity';

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
    ) { }

    async getAdminStats(tenantId: string, sectionId?: string) {
        let studentQb = this.studentRepository.createQueryBuilder('student').where('student.tenantId = :tenantId', { tenantId });
        let staffQb = this.staffRepository.createQueryBuilder('staff').where('staff.tenantId = :tenantId', { tenantId });
        let transQb = this.transactionRepository.createQueryBuilder('transaction').where('transaction.tenantId = :tenantId', { tenantId }).andWhere('transaction.type = :type', { type: TransactionType.FEE_PAYMENT });
        let classQb = this.classRepository.createQueryBuilder('cls').where('cls.tenantId = :tenantId', { tenantId });

        if (sectionId) {
            studentQb.innerJoin('student.class', 'cls', 'cls.schoolSectionId = :sectionId', { sectionId });
            staffQb.innerJoin('staff.sections', 'section', 'section.id = :sectionId', { sectionId });
            transQb.andWhere('transaction.schoolSectionId = :sectionId', { sectionId });
            classQb.andWhere('cls.schoolSectionId = :sectionId', { sectionId });
        }

        const totalStudents = await studentQb.getCount();
        const activeStudents = await studentQb.andWhere('student.isActive = :isActive', { isActive: true }).getCount();
        const inactiveStudents = totalStudents - activeStudents;

        const totalStaff = await this.staffRepository.count();
        const teachingStaff = await this.staffRepository.count();
        const nonTeachingStaff = totalStaff - teachingStaff;

        const totalClasses = await classQb.getCount();
        const totalSubjects = await this.subjectRepository.count();

        const totalRevenueResult = await transQb
            .select('SUM(transaction.amount)', 'total')
            .getRawOne();

        const outstandingFees = 0;

        return {
            students: { total: totalStudents, active: activeStudents, inactive: inactiveStudents },
            staff: { total: totalStaff, teaching: teachingStaff, nonTeaching: nonTeachingStaff },
            academics: { totalClasses, totalSubjects },
            finance: {
                totalRevenue: parseFloat(totalRevenueResult?.total || '0'),
                outstandingFees
            },
            feesOverview: {
                unpaid: 88,
                partial: 8,
                paid: 16
            },
            academicHealth: {
                teachersYetToSubmit: 3,
                topPerformingSubject: 'Mathematics',
                publishedResultsCount: 15,
                unpublishedResultsCount: 5,
                lowAttendanceClasses: ['JSS 1B', 'SS 2A'] // Retaining as it wasn't explicitly requested to be removed
            },
            studentPerformance: {
                schoolWideAverage: 68.5,
                topPerformingClasses: ['SS 3A', 'JSS 2C'],
                bottomPerformingClasses: ['JSS 1B', 'SS 1D'],
                studentsAtRisk: 14 // Mock count based on rule: Attendance < 65% AND Average < 45%
            },
            accounting: {
                totalExpenses: 350000,
                netBalance: 1250000, // Revenue - Expenses (Mock)
                payrollStatus: 'Pending Approval',
                latestExpense: { category: 'Maintenance', amount: 50000 }
            }
        };
    }

    async getAdminCharts(tenantId: string, sectionId?: string) {
        let maleQb = this.studentRepository.createQueryBuilder('student').where('student.tenantId = :tenantId', { tenantId }).andWhere('student.gender = :gender', { gender: 'Male' });
        let femaleQb = this.studentRepository.createQueryBuilder('student').where('student.tenantId = :tenantId', { tenantId }).andWhere('student.gender = :gender', { gender: 'Female' });
        let enrollQb = this.studentRepository.createQueryBuilder('student').where('student.tenantId = :tenantId', { tenantId });

        if (sectionId) {
            maleQb.innerJoin('student.class', 'cls1', 'cls1.schoolSectionId = :sectionId', { sectionId });
            femaleQb.innerJoin('student.class', 'cls2', 'cls2.schoolSectionId = :sectionId', { sectionId });
            enrollQb.innerJoin('student.class', 'cls3', 'cls3.schoolSectionId = :sectionId', { sectionId });
        }

        const maleStudents = await maleQb.getCount();
        const femaleStudents = await femaleQb.getCount();

        // Enrollment Trends (simplified to last 6 students for now, real trend requires date grouping)
        // For a real chart, we would group by month created_at
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
    }

    async getRecentActivities(tenantId: string, sectionId?: string) {
        let studQb = this.studentRepository.createQueryBuilder('student').where('student.tenantId = :tenantId', { tenantId }).orderBy('student.createdAt', 'DESC').take(5);
        let transQb = this.transactionRepository.createQueryBuilder('transaction').where('transaction.tenantId = :tenantId', { tenantId }).andWhere('transaction.type = :type', { type: TransactionType.FEE_PAYMENT }).orderBy('transaction.createdAt', 'DESC').take(5);

        if (sectionId) {
            studQb.innerJoin('student.class', 'cls', 'cls.schoolSectionId = :sectionId', { sectionId });
            transQb.andWhere('transaction.schoolSectionId = :sectionId', { sectionId });
        }

        const recentEnrollments = await studQb.getMany();
        const recentPayments = await transQb.getMany();

        return {
            recentEnrollments,
            recentPayments,
        };
    }
}
