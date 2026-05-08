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

export class CreateAdminDto {
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
    @IsStrongPassword()
    password: string;

    @IsNotEmpty()
    @IsString()
    @IsValidPhoneNumber()
    phoneNumber: string;

    @IsNotEmpty()
    @IsString()
    @Length(2, 2)
    countryCode: CountryCode;

    @IsNotEmpty({ message: 'roleId is required' })
    @IsUUID()
    roleId: string;
}