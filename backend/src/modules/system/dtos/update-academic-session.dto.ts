import { PartialType } from '@nestjs/mapped-types';
import { CreateAcademicSessionDto } from './create-academic-session.dto';

export class UpdateAcademicSessionDto extends PartialType(CreateAcademicSessionDto) { }
