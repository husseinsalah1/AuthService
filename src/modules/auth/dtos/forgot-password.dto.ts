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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ForgotPasswordDto {
    @ApiProperty({ enum: IdentifierType, example: IdentifierType.EMAIL })
    @IsEnum(IdentifierType)
    @IsNotEmpty()
    identifierType: IdentifierType;

    @ApiProperty({
        example: 'john.doe@example.com',
        description: 'Use email or phone number based on identifierType',
    })
    @IsString()
    @IsNotEmpty()
    @ValidateIf((o) => o.identifierType !== IdentifierType.PHONE_NUMBER)
    @IsEmail()
    @ValidateIf((o) => o.identifierType === IdentifierType.PHONE_NUMBER)
    @IsValidPhoneNumber()
    identifier: string;

    @ApiPropertyOptional({ example: 'EG', minLength: 2, maxLength: 2 })
    @ValidateIf((o) => {
        if (o.identifierType !== IdentifierType.PHONE_NUMBER) return false;

        const identifier = String(o.identifier ?? '');

        return !identifier.startsWith('+');
    })
    @IsString()
    @IsNotEmpty()
    @Length(2, 2)
    countryCode?: CountryCode;
}