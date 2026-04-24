// src/auth/dto/login.dto.ts

import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
    ValidateIf,
} from 'class-validator';
import { CountryCode } from 'libphonenumber-js';
import { IdentifierType } from '../enums/identifier-type.enum';

export class LoginDto {
    @IsEnum(IdentifierType)
    @IsNotEmpty()
    identifierType: IdentifierType;

    @IsString()
    @IsNotEmpty()
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