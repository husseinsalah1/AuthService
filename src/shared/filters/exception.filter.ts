// src/common/filters/all-exceptions.filter.ts

import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AppLogger } from '@/shared/logger';
import { ApiErrorResponse } from '@/shared/errors/types/api-error-response.interface';
import { ExceptionMapper } from '@/shared/errors/mappers/exception.mapper';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new AppLogger(AllExceptionsFilter.name);
    constructor(private readonly configService: ConfigService) {}

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();

        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();

        const isDev = this.configService.get<string>('NODE_ENV') === 'development';

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