import { PartialType } from '@nestjs/mapped-types';
import { CreateAcademicTermDto } from './create-academic-term.dto';

export class UpdateAcademicTermDto extends PartialType(CreateAcademicTermDto) { }
