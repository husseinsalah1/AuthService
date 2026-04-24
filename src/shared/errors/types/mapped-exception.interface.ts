import { ErrorItem } from "./error-item.interface";

export interface MappedException {
    statusCode: number;
    errors: ErrorItem[];
}