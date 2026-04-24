// src/common/validators/is-valid-phone.validator.ts

import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
} from 'class-validator';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function IsValidPhoneNumber(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isValidPhoneNumber',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: unknown, args: ValidationArguments) {
                    if (typeof value !== 'string') return false;

                    const dto = args.object as {
                        countryCode?: any;
                    };

                    const phone = parsePhoneNumberFromString(
                        value.trim(),
                        value.trim().startsWith('+') ? undefined : dto.countryCode,
                    );

                    return !!phone && phone.isValid();
                },

                defaultMessage() {
                    return 'identifier must be a valid phone number';
                },
            },
        });
    };
}