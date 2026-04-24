// src/common/errors/utils/validation-error.util.ts

import { ValidationError } from 'class-validator';
import { ErrorItem } from '../types/error-item.interface';

export function formatValidationErrors(
    errors: ValidationError[],
    parentPath = '',
): ErrorItem[] {
    const formattedErrors: ErrorItem[] = [];

    for (const error of errors) {
        const fieldPath = parentPath
            ? `${parentPath}.${error.property}`
            : error.property;

        if (error.constraints) {
            const messages = Object.values(error.constraints);

            for (const message of messages) {
                formattedErrors.push({
                    field: fieldPath,
                    message,
                });
            }
        }

        if (error.children && error.children.length > 0) {
            formattedErrors.push(
                ...formatValidationErrors(error.children, fieldPath),
            );
        }
    }

    return formattedErrors;
}