import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';

// Entities
import {
    Department,
    Staff,
    StaffAttendance,
    LeaveType,
    LeaveRequest,
    LeaveApproval,
    Payroll,
    TeacherRating,
} from './entities';
import { Role } from '../auth/entities/role.entity';

// Services
import { DepartmentService } from './services/department.service';
import { StaffService } from './services/staff.service';
import { AttendanceService } from './services/attendance.service';
import { LeaveService } from './services/leave.service';
import { PayrollService } from './services/payroll.service';
import { RatingService } from './services/rating.service';

// Controllers
import { DepartmentController } from './controllers/department.controller';
import { StaffController } from './controllers/staff.controller';
import { AttendanceController } from './controllers/attendance.controller';
import { LeaveController } from './controllers/leave.controller';
import { PayrollController } from './controllers/payroll.controller';
import { RatingController } from './controllers/rating.controller';

import { AuthModule } from '../auth/auth.module';
import { SystemModule } from '../system/system.module';
import { StudentsModule } from '../students/students.module';
import { AcademicsModule } from '../academics/academics.module';

import { BullModule } from '@nestjs/bull';
import { StaffImportProcessor } from './processors/staff-import.processor';
import { InternalCommunicationModule } from '../internal-communication/internal-communication.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        forwardRef(() => AuthModule),
        forwardRef(() => SystemModule),
        forwardRef(() => StudentsModule),
        forwardRef(() => AcademicsModule),
        forwardRef(() => InternalCommunicationModule),
        forwardRef(() => NotificationsModule),
        TypeOrmModule.forFeature([
            Department,
            Staff,
            StaffAttendance,
            LeaveType,
            LeaveRequest,
            LeaveApproval,
            Payroll,
            TeacherRating,
            Role,
        ]),
        BullModule.registerQueue({
            name: 'staff-import',
        }),
        MulterModule.register({
            // PRIVATE: leave supporting documents (medical/personal) are served
            // only via the authenticated, scoped download endpoint.
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const dir = './private-uploads/leaves';
                    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                    cb(null, dir);
                },
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    // Embed the original name (URL-encoded) so downloads keep their real filename.
                    cb(null, `${uniqueSuffix}__${encodeURIComponent(file.originalname)}`);
                },
            }),
        }),
    ],
    controllers: [
        DepartmentController,
        StaffController,
        AttendanceController,
        LeaveController,
        PayrollController,
        RatingController,
    ],
    providers: [
        DepartmentService,
        StaffService,
        AttendanceService,
        LeaveService,
        PayrollService,
        RatingService,
        StaffImportProcessor,
    ],
    exports: [
        // Export services for use in other modules
        StaffService,
        DepartmentService,
        AttendanceService,
        LeaveService,
        PayrollService,
        TypeOrmModule, // Export TypeOrmModule so Staff repository is injectable in other modules
    ],
})
export class HrModule { }
