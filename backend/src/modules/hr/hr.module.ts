import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

// Entities
import {
    Department,
    Designation,
    Staff,
    StaffAttendance,
    LeaveType,
    LeaveRequest,
    LeaveApproval,
    Payroll,
    TeacherRating,
} from './entities';

// Services
import { DepartmentService } from './services/department.service';
import { DesignationService } from './services/designation.service';
import { StaffService } from './services/staff.service';
import { AttendanceService } from './services/attendance.service';
import { LeaveService } from './services/leave.service';
import { PayrollService } from './services/payroll.service';
import { RatingService } from './services/rating.service';

// Controllers
import { DepartmentController } from './controllers/department.controller';
import { DesignationController } from './controllers/designation.controller';
import { StaffController } from './controllers/staff.controller';
import { AttendanceController } from './controllers/attendance.controller';
import { LeaveController } from './controllers/leave.controller';
import { PayrollController } from './controllers/payroll.controller';
import { RatingController } from './controllers/rating.controller';

import { AuthModule } from '../auth/auth.module';
import { StudentsModule } from '../students/students.module';

@Module({
    imports: [
        AuthModule,
        StudentsModule,
        TypeOrmModule.forFeature([
            Department,
            Designation,
            Staff,
            StaffAttendance,
            LeaveType,
            LeaveRequest,
            LeaveApproval,
            Payroll,
            TeacherRating,
        ]),
        MulterModule.register({
            storage: diskStorage({
                destination: './uploads/leaves',
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
        }),
    ],
    controllers: [
        DepartmentController,
        DesignationController,
        StaffController,
        AttendanceController,
        LeaveController,
        PayrollController,
        RatingController,
    ],
    providers: [
        DepartmentService,
        DesignationService,
        StaffService,
        AttendanceService,
        LeaveService,
        PayrollService,
        RatingService,
    ],
    exports: [
        // Export services for use in other modules
        StaffService,
        DepartmentService,
        DesignationService,
        AttendanceService,
        LeaveService,
        PayrollService,
    ],
})
export class HrModule { }
