// src/auth/utils/login-identifier.util.ts

import { BadRequestException } from '@nestjs/common';
import { CountryCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import { IdentifierType } from '../../modules/auth/enums/identifier-type.enum';

export interface ParsedLoginIdentifier {
    type: IdentifierType;
    value: string;
    countryCode?: CountryCode;
}

export function parseLoginIdentifier(params: {
    identifierType: IdentifierType;
    identifier: string;
    countryCode?: CountryCode;
}): ParsedLoginIdentifier {
    const { identifierType, countryCode } = params;
    const identifier = params.identifier.trim();

    if (identifierType === IdentifierType.EMAIL) {
        const email = identifier.toLowerCase();

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!isEmail) {
            throw new BadRequestException('Invalid email address');
        }

        return {
            type: IdentifierType.EMAIL,
            value: email,
        };
    }

    if (identifierType === IdentifierType.PHONE_NUMBER) {
        const isInternational = identifier.startsWith('+');

        if (!isInternational && !countryCode) {
            throw new BadRequestException(
                'Country code is required when logging in with a local phone number',
            );
        }

        const phone = parsePhoneNumberFromString(
            identifier,
            isInternational ? undefined : countryCode,
        );

        if (!phone || !phone.isValid()) {
            throw new BadRequestException('Invalid phone number');
        }

        return {
            type: IdentifierType.PHONE_NUMBER,
            value: phone.number,
            countryCode: phone.country ?? countryCode,
        };
    }

    throw new BadRequestException('Invalid identifier type');
}