import { ErrorItem } from "@/shared/errors/types/error-item.interface";

export interface MappedException {
    statusCode: number;
    errors: ErrorItem[];
}