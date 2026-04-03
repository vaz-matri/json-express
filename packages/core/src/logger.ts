import { RequestContext } from './request-context';
import type { ILogger } from './types';

/**
 * A zero-dependency fallback logger that uses standard console methods.
 * This ensures the Kernel can always log its boot sequence even if no 
 * logger plugin is installed.
 */
export class ConsoleLogger implements ILogger {
    constructor(private context: any = {}) {}

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
        // Debug is hidden by default in the basic console logger
    }

    child(context: any): ILogger {
        return new ConsoleLogger({ ...this.context, ...context });
    }

    private format(level: string, message: string, context?: any): string {
        const traceId = RequestContext.getTraceId();
        const ctx = {
            ...(traceId ? { traceId } : {}),
            ...this.context,
            ...context,
        };

        let prefix = '';
        const isDebugContext = process.env.JEX_DEBUG_CONTEXT === 'true' || process.env.JEX_DEBUG_CONTEXT === '1';
        
        // Diagnostic Mode: Warn if we are inside a component but lost the traceId
        if (isDebugContext && !traceId && this.context.component && this.context.component !== 'Kernel') {
            prefix = ' [⚠️ CONTEXT LOST]';
        }

        const ctxString = Object.keys(ctx).length > 0 ? ` ${JSON.stringify(ctx)}` : '';
        return `[${level}]${prefix} ${message}${ctxString}`;
    }
}
