// src/auth/dto/login.dto.ts

import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsString,
    Length,
    ValidateIf,
} from 'class-validator';
import { CountryCode } from 'libphonenumber-js';
import { IdentifierType } from '@/modules/auth/enums/identifier-type.enum';
import { IsValidPhoneNumber } from '@/shared/validators/is-valid-phone.validator';

export class VerifyOtpDto {
    @IsEnum(IdentifierType)
    @IsNotEmpty()
    identifierType: IdentifierType;

    @IsString()
    @IsNotEmpty()
    @ValidateIf((o) => o.identifierType !== IdentifierType.PHONE_NUMBER)
    @IsEmail()
    @ValidateIf((o) => o.identifierType === IdentifierType.PHONE_NUMBER)
    @IsValidPhoneNumber()
    identifier: string;

    @ValidateIf((o) => o.identifierType === IdentifierType.PHONE_NUMBER)
    @IsString()
    @IsNotEmpty()
    @Length(2, 2)
    countryCode?: CountryCode;

    @IsString()
    @IsNotEmpty()
    code: string;

}