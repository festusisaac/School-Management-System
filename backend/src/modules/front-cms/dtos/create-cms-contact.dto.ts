import { IsString, IsEmail, IsOptional, IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class CreateCmsContactDto {
    @IsString()
    @IsNotEmpty()
    fullName!: string;

    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    subject?: string;

    @IsString()
    @IsNotEmpty()
    message!: string;
}
