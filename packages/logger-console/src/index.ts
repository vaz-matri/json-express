import { RequestContext } from '@json-express/core';
import type { ILogger } from '@json-express/core';

/**
 * A zero-dependency default logger that uses standard console methods.
 * This is the framework default when no advanced logger is installed.
 */
export class ConsoleLogger implements ILogger {
    constructor(private options: { context?: any } = {}) {}

    info(message: string, context?: any): void {
        console.log(this.format('INFO', message, context));
    }

    warn(message: string, context?: any): void {
        console.warn(this.format('WARN', message, context));
    }

    error(message: string, context?: any): void {
        console.error(this.format('ERROR', message, context));
    }

    debug(message: string, context?: any): void {
        // Basic console logger doesn't show debug by default
    }

    child(context: any): ILogger {
        return new ConsoleLogger({ 
            context: { ...(this.options.context || {}), ...context } 
        });
    }

    private format(level: string, message: string, context?: any): string {
        const traceId = RequestContext.getTraceId();
        const ctx = {
            ...(traceId ? { traceId } : {}),
            ...(this.options.context || {}),
            ...context,
        };
        const ctxString = Object.keys(ctx).length > 0 ? ` ${JSON.stringify(ctx)}` : '';
        return `[${level}] ${message}${ctxString}`;
    }
}
