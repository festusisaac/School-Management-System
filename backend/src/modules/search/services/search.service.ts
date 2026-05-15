import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Brackets } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Staff } from '../../hr/entities/staff.entity';

@Injectable()
export class SearchService {
    constructor(
        @InjectRepository(Student)
        private readonly studentRepository: Repository<Student>,
        @InjectRepository(Staff)
        private readonly staffRepository: Repository<Staff>,
    ) {}

    async globalSearch(query: string, tenantId: string, userRole: string) {
        if (!query || query.length < 2) return { students: [], staff: [], modules: [] };

        const searchPattern = `%${query}%`;
        const words = query.trim().split(/\s+/);

        // Search Students (Admin, Staff, Teacher roles only)
        let students: any[] = [];
        const normalizedRole = userRole.toLowerCase().trim();
        const isSuperAdmin = normalizedRole === 'super administrator' || normalizedRole === 'super admin';
        const isStaffOrAdmin = isSuperAdmin || ['admin', 'administrator', 'staff', 'accountant', 'bursar'].includes(normalizedRole);

        if (isStaffOrAdmin) {
            const studentQuery = this.studentRepository.createQueryBuilder('student')
                .leftJoinAndSelect('student.class', 'class')
                .leftJoinAndSelect('student.section', 'section')
                .where('student.tenantId = :tenantId', { tenantId });

            studentQuery.andWhere(new Brackets(qb => {
                qb.where('student.firstName ILIKE :pattern', { pattern: searchPattern })
                  .orWhere('student.lastName ILIKE :pattern', { pattern: searchPattern })
                  .orWhere('student.admissionNo ILIKE :pattern', { pattern: searchPattern })
                  .orWhere("CONCAT(student.firstName, ' ', student.lastName) ILIKE :pattern", { pattern: searchPattern });
                
                if (words.length > 1) {
                    qb.orWhere(new Brackets(innerQb => {
                        innerQb.where('student.firstName ILIKE :word0', { word0: `%${words[0]}%` })
                               .andWhere('student.lastName ILIKE :word1', { word1: `%${words[1]}%` });
                    }));
                }
            }));

            students = await studentQuery.take(10).getMany();
        }

        // Search Staff (Admin and HR roles only)
        let staff: any[] = [];
        if (isSuperAdmin || ['admin', 'administrator', 'staff', 'accountant'].includes(normalizedRole)) {
            const staffQuery = this.staffRepository.createQueryBuilder('staff')
                .leftJoinAndSelect('staff.department', 'department')
                .where('staff.tenantId = :tenantId', { tenantId });

            staffQuery.andWhere(new Brackets(qb => {
                qb.where('staff.firstName ILIKE :pattern', { pattern: searchPattern })
                  .orWhere('staff.lastName ILIKE :pattern', { pattern: searchPattern })
                  .orWhere('staff.employeeId ILIKE :pattern', { pattern: searchPattern })
                  .orWhere("CONCAT(staff.firstName, ' ', staff.lastName) ILIKE :pattern", { pattern: searchPattern });

                if (words.length > 1) {
                    qb.orWhere(new Brackets(innerQb => {
                        innerQb.where('staff.firstName ILIKE :word0', { word0: `%${words[0]}%` })
                               .andWhere('staff.lastName ILIKE :word1', { word1: `%${words[1]}%` });
                    }));
                }
            }));

            staff = await staffQuery.take(10).getMany();
        }

        // Search Modules
        const modules = this.searchModules(query, normalizedRole);

        return {
            students: students.map(s => ({
                id: s.id,
                type: 'student',
                title: `${s.firstName} ${s.lastName || ''}`,
                subtitle: `Class: ${s.class?.name || 'N/A'} - Section: ${s.section?.name || 'N/A'} (${s.admissionNo})`,
                link: `/students/profile/${s.id}`,
                photo: s.studentPhoto,
            })),
            staff: staff.map(s => ({
                id: s.id,
                type: 'staff',
                title: `${s.firstName} ${s.lastName || ''}`,
                subtitle: `${s.department?.name || 'Staff'} (${s.employeeId})`,
                link: `/hr/staff/profile/${s.id}`,
                photo: s.photo,
            })),
            modules,
        };
    }

    private searchModules(query: string, userRole: string) {
        const allModules = [
            // Academics
            { title: 'Class Timetable', link: '/academics/class-timetable', roles: ['admin', 'teacher', 'staff'] },
            { title: 'School Sections', link: '/academics/school-sections', roles: ['admin'] },
            { title: 'Promotion', link: '/academics/promotion', roles: ['admin'] },
            { title: 'Subject Groups', link: '/academics/subject-groups', roles: ['admin'] },
            { title: 'Classes', link: '/academics/classes', roles: ['admin'] },
            { title: 'Sections', link: '/academics/sections', roles: ['admin'] },
            { title: 'Assign Class Teachers', link: '/academics/assign-class-teachers', roles: ['admin'] },
            { title: 'Assign Class Subjects', link: '/academics/assign-class-subjects', roles: ['admin'] },
            { title: 'Assign Subject Teachers', link: '/academics/assign-subject-teachers', roles: ['admin'] },
            
            // Students
            { title: 'Student Directory', link: '/students/directory', roles: ['admin', 'teacher', 'staff'] },
            { title: 'Student Admission', link: '/students/admission', roles: ['admin', 'staff'] },
            { title: 'Online Admission', link: '/students/online-admission', roles: ['admin', 'staff'] },
            { title: 'Student Categories', link: '/students/categories', roles: ['admin'] },
            { title: 'Student Houses', link: '/students/houses', roles: ['admin'] },
            { title: 'Attendance Reports', link: '/students/attendance/reports', roles: ['admin', 'teacher', 'staff'] },
            { title: 'Mark Attendance', link: '/students/attendance/mark', roles: ['admin', 'teacher'] },
            { title: 'Student Finance', link: '/students/finance', roles: ['admin', 'accountant'] },
            
            // HR
            { title: 'Staff Directory', link: '/hr/staff', roles: ['admin', 'staff'] },
            { title: 'Departments', link: '/hr/departments', roles: ['admin'] },
            { title: 'Staff Attendance', link: '/hr/attendance', roles: ['admin', 'staff'] },
            { title: 'Payroll', link: '/hr/payroll', roles: ['admin', 'accountant'] },
            { title: 'Approve Leave', link: '/hr/leave/approve', roles: ['admin', 'staff'] },
            { title: 'Teacher Ratings', link: '/hr/ratings', roles: ['admin'] },
            
            // Finance
            { title: 'Collect Fees', link: '/finance/record-payment', roles: ['admin', 'accountant'] },
            { title: 'Fees History', link: '/finance/payments', roles: ['admin', 'accountant'] },
            { title: 'Debtors List', link: '/finance/debtors', roles: ['admin', 'accountant'] },
            { title: 'Fee Structures', link: '/finance/structures', roles: ['admin', 'accountant'] },
            { title: 'Discounts', link: '/finance/discounts', roles: ['admin', 'accountant'] },
            { title: 'Payment Reminders', link: '/finance/reminders', roles: ['admin', 'accountant'] },
            { title: 'Carry Forward', link: '/finance/carry-forward', roles: ['admin', 'accountant'] },
            
            // Expenses
            { title: 'Expense Dashboard', link: '/expenses', roles: ['admin', 'accountant'] },
            { title: 'Expense Records', link: '/expenses/records', roles: ['admin', 'accountant'] },
            { title: 'Expense Categories', link: '/expenses/categories', roles: ['admin', 'accountant'] },
            { title: 'Expense Vendors', link: '/expenses/vendors', roles: ['admin', 'accountant'] },
            
            // Examination
            { title: 'Exam Groups', link: '/examination/setup/groups', roles: ['admin'] },
            { title: 'Exam Schedules', link: '/examination/setup/schedules', roles: ['admin'] },
            { title: 'Exam Scoresheet', link: '/examination/entry/scoresheet', roles: ['admin', 'teacher'] },
            { title: 'Report Cards', link: '/examination/reports/report-card', roles: ['admin', 'teacher'] },
            { title: 'Result Management', link: '/examination/control/results', roles: ['admin'] },
            { title: 'CBT Manager', link: '/examination/setup/cbt', roles: ['admin'] },
            
            // Library
            { title: 'Library Books', link: '/library', roles: ['admin', 'teacher', 'staff', 'student', 'parent'] },
            { title: 'Library Dashboard', link: '/library/dashboard', roles: ['admin', 'staff'] },
            { title: 'Issue Book', link: '/library/issue', roles: ['admin', 'staff'] },
            { title: 'Return Book', link: '/library/return', roles: ['admin', 'staff'] },
            
            // Communication
            { title: 'Noticeboard', link: '/communication/noticeboard', roles: ['all'] },
            { title: 'Send Broadcast', link: '/communication/send-broadcast', roles: ['admin'] },
            { title: 'Communication Templates', link: '/communication/templates', roles: ['admin'] },
            { title: 'Communication Logs', link: '/communication/logs', roles: ['admin'] },
            
            // Audit
            { title: 'Audit Overview', link: '/audit-reports/overview', roles: ['admin'] },
            { title: 'Activity Logs', link: '/audit-reports/activity', roles: ['admin'] },
            
            // Settings
            { title: 'General Settings', link: '/settings/general', roles: ['admin'] },
            { title: 'Sessions Management', link: '/settings/sessions', roles: ['admin'] },
            { title: 'Terms Management', link: '/settings/terms', roles: ['admin'] },
            { title: 'Roles & Permissions', link: '/settings/roles-permissions', roles: ['admin'] },
            { title: 'User Management', link: '/settings/users', roles: ['admin'] },
            { title: 'Payment Settings', link: '/settings/payments', roles: ['admin'] },
            { title: 'My Profile', link: this.getProfileLink(userRole), roles: ['all'] },
        ];

        const normalizedRole = userRole.toLowerCase().trim();
        const isSuperAdmin = normalizedRole === 'super administrator' || normalizedRole === 'super admin';
        const searchLower = query.toLowerCase();

        return allModules
            .filter(m => 
                (m.title.toLowerCase().includes(searchLower) || m.link.toLowerCase().includes(searchLower)) &&
                (m.roles.includes('all') || isSuperAdmin || m.roles.includes(normalizedRole) || (normalizedRole === 'admin' && m.roles.includes('admin')))
            )
            .slice(0, 10)
            .map(m => ({
                type: 'module',
                title: m.title,
                subtitle: 'Navigation',
                link: m.link,
            }));
    }
    
    private getProfileLink(role: string): string {
        const normalized = role.toLowerCase().trim();
        if (normalized.includes('admin')) {
            return '/settings/profile';
        }
        if (['teacher', 'staff', 'accountant', 'bursar', 'receptionist', 'librarian'].includes(normalized)) {
            return '/hr/staff/profile';
        }
        if (normalized === 'parent') {
            return '/parent/profile';
        }
        if (normalized === 'student') {
            return '/student/profile';
        }
        return '/settings/profile';
    }
}

