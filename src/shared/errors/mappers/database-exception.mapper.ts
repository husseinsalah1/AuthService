// src/common/errors/mappers/database-exception.mapper.ts

import { HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { extractDuplicateMessage } from '../utils/duplicate-error.util';
import { MappedException } from '../types/mapped-exception.interface';

interface PostgresDriverError {
    code?: string;
    detail?: string;
    constraint?: string;
    column?: string;
    table?: string;
}

export class DatabaseExceptionMapper {
    static map(exception: unknown): MappedException | null {
        if (!(exception instanceof QueryFailedError)) {
            return null;
        }

        const driverError = exception.driverError as PostgresDriverError;

        switch (driverError.code) {
            // Duplicate key violation
            case '23505':
                return {
                    statusCode: HttpStatus.CONFLICT,
                    errors: [
                        {
                            field: this.extractFieldFromDetail(driverError.detail),
                            message: extractDuplicateMessage(driverError.detail),
                        },
                    ],
                };

            // Foreign key violation
            case '23503':
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    errors: [
                        {
                            message: 'Related record does not exist',
                        },
                    ],
                };

            // Not null violation
            case '23502':
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    errors: [
                        {
                            field: driverError.column,
                            message: `${driverError.column ?? 'Required field'} is required`,
                        },
                    ],
                };

            // Invalid text representation, example invalid UUID
            case '22P02':
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    errors: [
                        {
                            message: 'Invalid input format',
                        },
                    ],
                };

            default:
                return {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    errors: [
                        {
                            message: 'Database operation failed',
                        },
                    ],
                };
        }
    }

    private static extractFieldFromDetail(detail?: string): string | undefined {
        if (!detail) {
            return undefined;
        }

        const match = detail.match(/\((.*?)\)=/);

        return match?.[1];
    }
}