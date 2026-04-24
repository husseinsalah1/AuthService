// src/common/errors/utils/duplicate-error.util.ts

export function extractDuplicateMessage(detail?: string): string {
    if (!detail) {
        return 'Duplicate value already exists';
    }

    const match = detail.match(/\((.*?)\)=\((.*?)\)/);

    if (!match) {
        return 'Duplicate value already exists';
    }

    const field = match[1];
    const value = match[2];

    return `${field} '${value}' already exists`;
}