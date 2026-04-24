import { IsEmail, IsString, MinLength, IsOptional, IsMobilePhone, IsNotEmpty, Matches, Length } from 'class-validator';
import { CountryCode } from 'libphonenumber-js';

export class RegisterDto {
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
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
        message:
            'password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    })
    password: string;

    @IsNotEmpty()
    @IsString()
    phoneNumber: string;

    @IsNotEmpty()
    @IsString()
    @Length(2, 2)
    countryCode: CountryCode;
}