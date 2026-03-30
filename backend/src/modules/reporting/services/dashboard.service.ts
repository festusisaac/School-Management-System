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

    async getAdminStats() {
        const totalStudents = await this.studentRepository.count();
        const activeStudents = await this.studentRepository.count({ where: { isActive: true } });
        const inactiveStudents = totalStudents - activeStudents;

        const totalStaff = await this.staffRepository.count();
        const teachingStaff = await this.staffRepository.count();
        const nonTeachingStaff = totalStaff - teachingStaff;

        const totalClasses = await this.classRepository.count();
        const totalSubjects = await this.subjectRepository.count();

        const totalRevenueResult = await this.transactionRepository
            .createQueryBuilder('transaction')
            .select('SUM(transaction.amount)', 'total')
            .where('transaction.type = :type', { type: TransactionType.FEE_PAYMENT })
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

    async getAdminCharts() {
        // Gender Distribution
        const maleStudents = await this.studentRepository.count({ where: { gender: 'Male' } });
        const femaleStudents = await this.studentRepository.count({ where: { gender: 'Female' } });

        // Enrollment Trends (simplified to last 6 students for now, real trend requires date grouping)
        // For a real chart, we would group by month created_at
        const enrollmentData = await this.studentRepository
            .createQueryBuilder('student')
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

    async getRecentActivities() {
        const recentEnrollments = await this.studentRepository.find({
            order: { createdAt: 'DESC' },
            take: 5,
            select: ['id', 'firstName', 'lastName', 'createdAt'],
        });

        const recentPayments = await this.transactionRepository.find({
            where: { type: TransactionType.FEE_PAYMENT },
            order: { createdAt: 'DESC' },
            take: 5,
        });

        return {
            recentEnrollments,
            recentPayments,
        };
    }
}
