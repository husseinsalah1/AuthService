// src/common/logger/logger.formatter.ts
import { LogLevel } from './logger.enum';
import { colorize } from './logger.colors';

export function formatMessage(
    level: LogLevel,
    context: string,
    message: string,
): string {
    const timestamp = new Date().toISOString();
    const colorMap: Record<LogLevel, Parameters<typeof colorize>[0]> = {
        [LogLevel.INFO]: 'info',
        [LogLevel.ERROR]: 'error',
        [LogLevel.WARN]: 'warn',
        [LogLevel.DEBUG]: 'debug',
    };

    const coloredLevel = colorize(colorMap[level], `[${level}]`);
    const coloredContext = colorize('debug', `[${context}]`);

    return `${timestamp} ${coloredLevel} ${coloredContext} ${message}`;
}