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

export class SendOtpDto {
    @IsEnum(IdentifierType)
    @IsNotEmpty()
    identifierType: IdentifierType;

    @IsString()
    @IsNotEmpty()
    identifier: string;

    @ValidateIf((o) => o.identifierType === IdentifierType.PHONE_NUMBER)
    @IsString()
    @IsNotEmpty()
    @Length(2, 2)
    countryCode?: CountryCode;
}