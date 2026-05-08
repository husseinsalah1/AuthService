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

export class LoginDto {
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

    @ValidateIf((o) => {
        if (o.identifierType !== IdentifierType.PHONE_NUMBER) return false;

        const identifier = String(o.identifier ?? '');

        return !identifier.startsWith('+');
    })
    @IsString()
    @IsNotEmpty()
    @Length(2, 2)
    countryCode?: CountryCode;

    @IsString()
    @IsNotEmpty()
    password: string;
}