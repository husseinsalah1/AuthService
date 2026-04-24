import {
    CallHandler,
    ExecutionContext,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface Meta {
    total: number;
    page: number;
    limit: number;
    pageCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    meta?: Meta;
    timestamp: string;
    statusCode: number;
}

export interface InterceptorResponse<T> {
    data: T;
    message?: string;
    meta?: Meta;
}

function isPlainMessageOnlyObject(
    value: unknown,
): value is { message: string } {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    const keys = Object.keys(value as object);
    return (
        keys.length === 1 &&
        keys[0] === 'message' &&
        typeof (value as { message: unknown }).message === 'string'
    );
}

/** Empty or message-only payloads become `{}`; sole `message` is returned for hoisting. */
function normalizeDataPayload<T>(
    payload: T,
): { data: T | Record<string, never>; hoistedMessage?: string } {
    if (payload === null || payload === undefined) {
        return { data: {} };
    }
    if (
        typeof payload === 'object' &&
        !Array.isArray(payload) &&
        Object.keys(payload as object).length === 0
    ) {
        return { data: {} };
    }
    if (isPlainMessageOnlyObject(payload)) {
        return { data: {}, hoistedMessage: payload.message };
    }
    return { data: payload };
}

export class TransformInterceptor<T>
    implements NestInterceptor<T | InterceptorResponse<T>, ApiResponse<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler<T | InterceptorResponse<T>>,
    ): Observable<ApiResponse<T>> {
        const response = context.switchToHttp().getResponse();

        return next.handle().pipe(
            map((result) => {
                const isWrappedResponse =
                    typeof result === 'object' &&
                    result !== null &&
                    'data' in result;

                const rawPayload = isWrappedResponse
                    ? (result as InterceptorResponse<T>).data
                    : (result as T);
                let message = isWrappedResponse
                    ? (result as InterceptorResponse<T>).message
                    : undefined;
                const meta = isWrappedResponse
                    ? (result as InterceptorResponse<T>).meta
                    : undefined;

                const { data: payload, hoistedMessage } =
                    normalizeDataPayload(rawPayload);
                if (hoistedMessage !== undefined) {
                    message = message ?? hoistedMessage;
                }

                return {
                    success: true,
                    message: message ?? 'Operation completed successfully',
                    data: payload as T,
                    meta,
                    timestamp: new Date().toISOString(),
                    statusCode: response.statusCode,
                };
            }),
        );
    }
}