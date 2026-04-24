// src/common/errors/mappers/http-exception.mapper.ts

import { HttpException } from '@nestjs/common';
import { ErrorItem } from '../types/error-item.interface';
import { MappedException } from '../types/mapped-exception.interface';

export class HttpExceptionMapper {
    static map(exception: HttpException): MappedException {
        const exceptionResponse = exception.getResponse();

        return {
            statusCode: exception.getStatus(),
            errors: this.normalizeExceptionResponse(exceptionResponse),
        };
    }

    private static normalizeExceptionResponse(
        exceptionResponse: unknown,
    ): ErrorItem[] {
        if (typeof exceptionResponse === 'string') {
            return [
                {
                    message: exceptionResponse,
                },
            ];
        }

        if (
            typeof exceptionResponse === 'object' &&
            exceptionResponse !== null
        ) {
            const res = exceptionResponse as Record<string, any>;

            /**
             * Custom format:
             * {
             *   errors: [
             *     { field: 'email', message: 'email must be an email' }
             *   ]
             * }
             */
            if (Array.isArray(res.errors)) {
                return res.errors.map((err: any) => ({
                    ...(err?.field && { field: err.field }),
                    message: err?.message ?? 'Unknown error',
                }));
            }

            /**
             * NestJS ValidationPipe default format:
             * {
             *   message: [
             *     'email must be an email',
             *     'password should not be empty'
             *   ],
             *   error: 'Bad Request',
             *   statusCode: 400
             * }
             */
            if (Array.isArray(res.message)) {
                return res.message.map((msg: string) =>
                    this.formatValidationMessage(msg),
                );
            }

            /**
             * Normal HttpException format:
             * {
             *   message: 'Invalid credentials'
             * }
             */
            if (typeof res.message === 'string') {
                return [
                    this.formatValidationMessage(res.message),
                ];
            }
        }

        return [
            {
                message: 'Internal server error',
            },
        ];
    }

    private static formatValidationMessage(message: string): ErrorItem {
        const field = this.extractFieldFromMessage(message);

        return {
            ...(field && { field }),
            message,
        };
    }

    private static extractFieldFromMessage(message: string): string | undefined {
        const firstWord = message.split(' ')[0];

        if (!firstWord) {
            return undefined;
        }

        /**
         * class-validator messages usually start with the field name:
         *
         * "email must be an email"
         * "password should not be empty"
         * "phoneNumber must be a string"
         */
        return firstWord;
    }
}