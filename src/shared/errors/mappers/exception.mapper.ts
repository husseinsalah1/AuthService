// src/common/errors/mappers/exception.mapper.ts

import { HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseExceptionMapper } from '@/shared/errors/mappers/database-exception.mapper';
import { HttpExceptionMapper } from '@/shared/errors/mappers/http-exception.mapper';
import { MappedException } from '@/shared/errors/types/mapped-exception.interface';

export class ExceptionMapper {
    static map(exception: unknown): MappedException {
        const databaseError = DatabaseExceptionMapper.map(exception);

        if (databaseError) {
            return databaseError;
        }

        if (exception instanceof HttpException) {
            return HttpExceptionMapper.map(exception);
        }

        return {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            errors: [
                {
                    message: 'Internal server error',
                },
            ],
        };
    }
}