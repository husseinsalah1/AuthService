import { IsEmail, IsString, IsNotEmpty, Length } from 'class-validator';
import { CountryCode } from 'libphonenumber-js';
import { IsValidPhoneNumber } from '@/shared/validators/is-valid-phone.validator';
import { IsStrongPassword } from '@/shared/validators/is-strong-password.validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'John' })
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsNotEmpty()
    @IsString()
    lastName: string;

    @ApiProperty({ example: 'john.doe@example.com' })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'Str0ng!Pass' })
    @IsNotEmpty()
    @IsStrongPassword()
    password: string;

    @ApiProperty({ example: '+201012345678' })
    @IsNotEmpty()
    @IsString()
    @IsValidPhoneNumber()
    phoneNumber: string;

    @ApiProperty({ example: 'EG', minLength: 2, maxLength: 2 })
    @IsNotEmpty()
    @IsString()
    @Length(2, 2)
    countryCode: CountryCode;
}