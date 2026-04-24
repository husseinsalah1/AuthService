import { IsEmail, IsEnum, IsOptional, IsString, MinLength, IsMobilePhone, IsNotEmpty } from 'class-validator';
import { UserStatus } from '../enums';

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    password: string;

    @IsNotEmpty()
    @IsString()
    phoneNumber: string;

    @IsNotEmpty()
    @IsString()
    countryCode: string;
}