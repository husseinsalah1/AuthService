import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MinLength } from 'class-validator';

export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

export function IsStrongPassword(): PropertyDecorator {
    return applyDecorators(
        IsString(),
        MinLength(8),
        Matches(STRONG_PASSWORD_REGEX, {
            message:
                'password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        }),
    );
}
