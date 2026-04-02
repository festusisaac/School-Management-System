import { Process, Processor, OnQueueProgress, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { ScoreEntryService } from '../services/score-entry.service';
import { Logger } from '@nestjs/common';

@Processor('score-import')
export class ScoreImportProcessor {
  private readonly logger = new Logger(ScoreImportProcessor.name);

  constructor(private readonly scoreEntryService: ScoreEntryService) {}

  @Process('import-scores')
  async handleImport(job: Job<{ 
    data: any[]; 
    examId: string;
    assessmentTypeId: string;
    tenantId: string; 
    userEmail: string 
  }>) {
    const { data, examId, assessmentTypeId, tenantId } = job.data;
    const total = data.length;
    
    const results = {
      success: 0,
      failed: 0,
      records: [] as any[],
      errors: [] as any[]
    };

    this.logger.log(`Starting background score import for Exam ID: ${examId}, ${total} records...`);

    // Process in batches of 50 for performance and reactivity
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        try {
            // Mapping CSV/Excel fields to internal format
            // Expected CSV format: Admission Number, First CA, Second CA, Final Exams
            // We'll prioritize 'Admission Number' and matching the respective score based on assessmentTypeId
            
            const admissionNo = item['Admission Number'] || item['admissionNo'] || item['AdmissionNo'];
            let scoreValue = 0;
            
            // Auto-detect which column to use based on the assessment type provided
            // This is a bit flexible to handle various template versions
            if (assessmentTypeId) {
                // If we know the assessment type, we try to find a matching column
                // In the JSS2 scripts, we generated "First CA", "Second CA", "Final Exams"
                const possibleKeys = [
                   'score', 'Score', 'marks', 'Marks', 
                   'First CA', 'Second CA', 'Final Exams', '1st CA', '2nd CA', '3rd CA', '4th CA', 'Final Exam', 'Exams', 'Exam'
                ];
                
                // If it's a specific assessment import, the user might have only one score column
                scoreValue = item.scoreValue || item.score || item.marks || 0;
                
                // Fallback: search for keys that match roughly
                if (scoreValue === 0) {
                    for (const key of Object.keys(item)) {
                        if (key.toLowerCase().includes('score') || key.toLowerCase().includes('exam') || key.toLowerCase().includes('ca')) {
                            scoreValue = parseFloat(item[key]);
                            break;
                        }
                    }
                }
            }

            if (!admissionNo) {
                throw new Error('Missing Admission Number');
            }

            await this.scoreEntryService.saveSingleBatchMark({
                admissionNo,
                examId,
                assessmentTypeId,
                score: scoreValue,
                tenantId
            });

            results.success++;

        } catch (error: any) {
            results.failed++;
            results.errors.push({
                admissionNo: item['Admission Number'] || 'Unknown',
                error: error.message
            });
            this.logger.error(`Failed to import score for ${item['Admission Number']}: ${error.message}`);
        }

        // Update progress
        if (i % 10 === 0 || i === total - 1) {
            const progress = Math.round(((i + 1) / total) * 100);
            await job.progress(progress);
        }
    }

    this.logger.log(`Score import complete: ${results.success} success, ${results.failed} failed.`);
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
