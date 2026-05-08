import { IsEmail, IsString, MinLength, IsNotEmpty, Length } from 'class-validator';
import { IsValidPhoneNumber } from '@/shared/validators/is-valid-phone.validator';

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
    @IsValidPhoneNumber()
    phoneNumber: string;

    @IsNotEmpty()
    @IsString()
    @Length(2, 2)
    countryCode: string;
}