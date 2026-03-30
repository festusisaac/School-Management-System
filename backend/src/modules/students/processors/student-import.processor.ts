import { Process, Processor, OnQueueProgress, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { StudentsService } from '../services/students.service';
import { Logger } from '@nestjs/common';

@Processor('student-import')
export class StudentImportProcessor {
  private readonly logger = new Logger(StudentImportProcessor.name);

  constructor(private readonly studentsService: StudentsService) {}

  @Process('import-students')
  async handleImport(job: Job<{ data: any[]; tenantId: string; userEmail: string }>) {
    const { data, tenantId, userEmail } = job.data;
    const total = data.length;
    
    const results = {
      success: 0,
      failed: 0,
      records: [] as any[],
      errors: [] as any[]
    };

    this.logger.log(`Starting background student import for ${total} records...`);

    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        try {
            // Stripping UI fields and ensuring correct persistence
            const { validationStatus, errors, className, sectionName, categoryName, houseName, ...studentDataRaw } = item;
            
            // Ensure dates are valid Date objects
            const dob = item.dob ? new Date(item.dob) : null;
            const admissionDate = item.admissionDate ? new Date(item.admissionDate) : new Date();

            const studentDto = {
                ...studentDataRaw,
                dob,
                admissionDate,
                tenantId
            };

            const saved = await this.studentsService.create(studentDto as any, tenantId);
            results.success++;
            results.records.push({ 
                firstName: saved.firstName, 
                lastName: saved.lastName, 
                admissionNo: saved.admissionNo,
                email: saved.email
            });

        } catch (error: any) {
            results.failed++;
            results.errors.push({
                admissionNo: item.admissionNo || 'N/A',
                firstName: item.firstName || 'N/A',
                error: error.message
            });
            this.logger.error(`Failed to import student ${item.admissionNo}: ${error.message}`);
        }

        // Update progress every 5 records or at the end
        if (i % 5 === 0 || i === total - 1) {
            const progress = Math.round(((i + 1) / total) * 100);
            await job.progress(progress);
        }
    }

    this.logger.log(`Student import complete: ${results.success} success, ${results.failed} failed.`);
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
