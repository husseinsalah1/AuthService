import {
    IsEmail,
    IsNotEmpty,
    IsString,
    IsUUID,
    Length,
} from "class-validator";
import { CountryCode } from "libphonenumber-js";
import { IsValidPhoneNumber } from "@/shared/validators/is-valid-phone.validator";
import { IsStrongPassword } from "@/shared/validators/is-strong-password.validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateAdminDto {
    @ApiProperty({ example: 'Admin' })
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'User' })
    @IsNotEmpty()
    @IsString()
    lastName: string;

    @ApiProperty({ example: 'admin@example.com' })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'Str0ng!AdminPass' })
    @IsNotEmpty()
    @IsStrongPassword()
    password: string;

    @ApiProperty({ example: '+201012345679' })
    @IsNotEmpty()
    @IsString()
    @IsValidPhoneNumber()
    phoneNumber: string;

    @ApiProperty({ example: 'EG', minLength: 2, maxLength: 2 })
    @IsNotEmpty()
    @IsString()
    @Length(2, 2)
    countryCode: CountryCode;

    @ApiProperty({ example: '8a83eb8e-a0e2-4e77-86f4-d76f4ac4ef06' })
    @IsNotEmpty({ message: 'roleId is required' })
    @IsUUID()
    roleId: string;
}