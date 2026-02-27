import { IsString, IsNotEmpty } from 'class-validator';

export class CreateStudentCategoryDto {
    @IsString()
    @IsNotEmpty()
    category!: string;
}

export class UpdateStudentCategoryDto {
    @IsString()
    @IsNotEmpty()
    category!: string;
}
