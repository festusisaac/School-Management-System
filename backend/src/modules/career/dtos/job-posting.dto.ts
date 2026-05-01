import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUrl } from 'class-validator';
import { JobType, JobStatus } from '../entities/job-posting.entity';

export class CreateJobPostingDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  company!: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(JobType)
  @IsOptional()
  type?: JobType;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsOptional()
  requirements?: string;

  @IsString()
  @IsOptional()
  salaryRange?: string;

  @IsUrl()
  @IsOptional()
  applicationUrl?: string;

  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;
}

export class UpdateJobPostingDto extends CreateJobPostingDto {}
