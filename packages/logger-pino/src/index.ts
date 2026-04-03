import { RequestContext } from '@json-express/core';
import pino from 'pino';
import type { ILogger, IConfigProvider } from '@json-express/core';
import { join } from 'path';

/**
 * Enterprise-grade Pino logger implementation for JSON Express.
 * Supports 12-Factor (Stdout) and Spring-Boot Style (File) modes.
 */
export class PinoLogger implements ILogger {
    private logger: pino.Logger;

    constructor(options: { configProvider?: IConfigProvider, _instance?: pino.Logger } = {}) {
        if (options._instance) {
            this.logger = options._instance;
            return;
        }

        const cwd = process.cwd();
        const config = options.configProvider;
        
        // 1. Resolve Configuration
        const logLevel = config?.get<string>('log.level', 'info') || 'info';
        const logPath = config?.get<string>('log.path', './logs') || './logs';
        const isPretty = config?.get<boolean>('log.pretty', process.env.NODE_ENV === 'development') ?? (process.env.NODE_ENV === 'development');

        // 2. Configure Transport
        let transport;

        if (logPath === 'stdout' || logPath === 'stderr') {
            if (isPretty) {
                // 12-Factor Mode: Pretty stream
                transport = pino.transport({
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: 'HH:MM:ss Z',
                        ignore: 'pid,hostname',
                        destination: logPath === 'stdout' ? 1 : 2,
                    }
                });
            } else {
                // Standard stream (raw JSON)
                transport = pino.transport({
                    target: 'pino/file',
                    options: { destination: logPath === 'stdout' ? 1 : 2 }
                });
            }
        } else {
            // Enterprise Mode: File-based logging (supports both default and custom paths)
            const destination = logPath.endsWith('.log') 
                ? (logPath.startsWith('/') ? logPath : join(cwd, logPath))
                : join(cwd, logPath, 'app.log');

            transport = pino.transport({
                target: 'pino/file',
                options: { destination, mkdir: true }
            });
        }

        // 3. Initialize Pino instance
        this.logger = pino({
            level: logLevel,
        }, transport);
    }

    public info(message: string, context?: any): void {
        const traceId = RequestContext.getTraceId();
        this.logger.info({ ...(traceId ? { traceId } : {}), ...context }, message);
    }

    public warn(message: string, context?: any): void {
        const traceId = RequestContext.getTraceId();
        this.logger.warn({ ...(traceId ? { traceId } : {}), ...context }, message);
    }

    public error(message: string, context?: any): void {
        const traceId = RequestContext.getTraceId();
        this.logger.error({ ...(traceId ? { traceId } : {}), ...context }, message);
    }

    public debug(message: string, context?: any): void {
        const traceId = RequestContext.getTraceId();
        this.logger.debug({ ...(traceId ? { traceId } : {}), ...context }, message);
    }

    public child(context: any): ILogger {
        return new PinoLogger({ _instance: this.logger.child(context) } as any);
    }
}
