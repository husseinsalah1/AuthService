// src/common/errors/types/api-error-response.interface.ts

import { ErrorItem } from '@/shared/errors/types/error-item.interface';

export interface ApiErrorResponse {
    success: false;
    errors: ErrorItem[];
    path: string;
    method: string;
    timestamp: string;
    statusCode: number;
    stack?: string;
    service?: string;
}