import { Process, Processor, OnQueueProgress, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { StaffService } from '../services/staff.service';
import { Logger } from '@nestjs/common';
import { StaffStatus } from '../entities/staff.entity';

@Processor('staff-import')
export class StaffImportProcessor {
  private readonly logger = new Logger(StaffImportProcessor.name);

  constructor(private readonly staffService: StaffService) {}

  @Process('import-staff')
  async handleImport(job: Job<{ data: any[]; tenantId: string; userEmail: string }>) {
    const { data, tenantId, userEmail } = job.data;
    const total = data.length;
    
    const results = {
      success: 0,
      failed: 0,
      records: [] as any[],
      errors: [] as any[]
    };

    this.logger.log(`Starting background import for ${total} staff members...`);

    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        try {
            // Ensure password logic: Staff@numberSuffix (e.g. PHJC/STF/001 -> Staff@001)
            const employeeIdStr = String(item.employeeId || '');
            const idNumber = employeeIdStr.match(/\d+$/)?.[0] || employeeIdStr;
            const password = `Staff@${idNumber}`;
            
            // Stripping UI fields and ensuring correct persistence
            const { validationStatus, errors, ...staffDataRaw } = item;
            
            // Clean UUID fields (convert "" to null)
            const departmentId = item.departmentId === '' ? null : item.departmentId;
            const roleId = item.roleId === '' ? null : item.roleId;

            const staffDto = {
                ...staffDataRaw,
                departmentId,
                roleId,
                status: StaffStatus.ACTIVE,
                enableLogin: true, 
                password,
                dateOfJoining: item.dateOfJoining || new Date().toISOString(),
                employmentType: item.employmentType || 'Full-Time',
                gender: item.gender || 'Male',
                basicSalary: item.basicSalary || 0
            };

            const saved = await this.staffService.create(staffDto as any, tenantId) as any;
            results.success++;
            // Include password in result for display in the summary
            results.records.push({ 
                firstName: saved.firstName, 
                lastName: saved.lastName, 
                email: saved.email, 
                initialPassword: password 
            });

        } catch (error: any) {
            results.failed++;
            results.errors.push({
                employeeId: item.employeeId,
                error: error.message
            });
        }

        // Update progress every 5 records or at the end
        if (i % 5 === 0 || i === total - 1) {
            const progress = Math.round(((i + 1) / total) * 100);
            await job.progress(progress);
        }
    }

    this.logger.log(`Import complete: ${results.success} success, ${results.failed} failed.`);
    return results;
  }

  @OnQueueProgress()
  onProgress(job: Job, progress: number) {
    this.logger.debug(`Job ${job.id} progress: ${progress}%`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} completed successfully.`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}
