// src/common/utils/phone-number.util.ts

import {
    CountryCode,
    parsePhoneNumberFromString,
} from 'libphonenumber-js';
import { BadRequestException } from '@nestjs/common';

export interface NormalizedPhoneNumber {
    phoneNumber: string; // +201032929703
    countryCode: CountryCode; // EG
    dialCode: string; // +20
    nationalNumber: string; // 1032929703
}

export function normalizePhoneNumber(
    phoneNumber: string,
    countryCode: CountryCode,
): NormalizedPhoneNumber {
    const phone = parsePhoneNumberFromString(phoneNumber.trim(), countryCode);

    if (!phone || !phone.isValid()) {
        throw new BadRequestException('Invalid phone number');
    }

    return {
        phoneNumber: phone.number,
        countryCode: phone.country ?? countryCode,
        dialCode: `+${phone.countryCallingCode}`,
        nationalNumber: phone.nationalNumber,
    };
}