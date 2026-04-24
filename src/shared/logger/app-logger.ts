// src/common/logger/app.logger.ts
import { LogLevel } from './logger.enum';
import { formatMessage } from './logger.formatter';

export class AppLogger {
    private readonly context: string;

    constructor(context: string) {
        this.context = context;
    }

    log(message: string): void {
        console.log(formatMessage(LogLevel.INFO, this.context, message));
    }

    error(message: string, trace?: string): void {
        console.error(formatMessage(LogLevel.ERROR, this.context, message));
        if (trace) {
            console.error(trace);
        }
    }

    warn(message: string): void {
        console.warn(formatMessage(LogLevel.WARN, this.context, message));
    }

    debug(message: string): void {
        console.debug(formatMessage(LogLevel.DEBUG, this.context, message));
    }
}