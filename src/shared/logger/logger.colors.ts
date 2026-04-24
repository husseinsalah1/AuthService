export const Colors = {
    reset: '\x1b[0m',
    info: '\x1b[32m',
    error: '\x1b[31m',
    warn: '\x1b[33m',
    debug: '\x1b[34m',
} as const;


export function colorize(color: keyof typeof Colors, text: string): string {
    return `${Colors[color]}${text}${Colors.reset}`;
}