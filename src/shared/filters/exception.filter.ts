// src/common/filters/all-exceptions.filter.ts

import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLogger } from 'src/shared/logger';
import { ApiErrorResponse } from '../errors/types/api-error-response.interface';
import { ExceptionMapper } from '../errors/mappers/exception.mapper';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new AppLogger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();

        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();

        const isDev = process.env.NODE_ENV === 'development';

        const mappedError = ExceptionMapper.map(exception);

        const errorResponse: ApiErrorResponse = {
            success: false,
            errors: mappedError.errors,
            path: request.url,
            method: request.method,
            timestamp: new Date().toISOString(),
            statusCode: mappedError.statusCode,
            service: 'Auth',
            ...(isDev &&
                exception instanceof Error && {
                stack: exception.stack,
            }),
        };

        this.logger.error(
            `[Exception] ${request.method} ${request.url} - ${mappedError.statusCode} - ${mappedError.errors
                .map((e) => e.message)
                .join(', ')}`,
            exception instanceof Error ? exception.stack : undefined,
        );

        response.status(mappedError.statusCode).json(errorResponse);
    }
}