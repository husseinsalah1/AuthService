import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { AppLogger } from '../logger';



@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new AppLogger(LoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();

        const url = request.originalUrl || request.url;
        const method = request.method;
        const startTime = Date.now();
        const controllerName = context.getClass().name;
        const actionName = context.getHandler().name;

        this.logger.log(
            `[Incoming] ${method} ${url} → [${controllerName}.${actionName}]`,
        );

        return next.handle().pipe(
            tap({
                next: () => {
                    const duration = Date.now() - startTime;
                    const statusCode = response.statusCode;

                    this.logger.log(
                        `[Completed] ${method} ${url} | statusCode=${statusCode} | duration=${duration}ms → [${controllerName}.${actionName}]`,
                    );
                },
                error: (error) => {
                    const duration = Date.now() - startTime;
                    const statusCode = error?.status || response.statusCode || 500;

                    this.logger.error(
                        `[Failed] ${method} ${url} | statusCode=${statusCode} | duration=${duration}ms → [${controllerName}.${actionName}] | message=${error?.message ?? 'Unknown error'}`,
                    );
                },
            }),
        );
    }

}