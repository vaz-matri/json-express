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
        const logPath = config?.get<string>('log.path');
        const isPretty = config?.get<boolean>('log.pretty', process.env.NODE_ENV === 'development') ?? (process.env.NODE_ENV === 'development');

        // 2. Configure Transport
        let transport;

        if (logPath) {
            // Enterprise Mode: File-based logging
            // Resolve path: if directory, use app.log; if file, use as is.
            const destination = logPath.endsWith('.log') 
                ? join(cwd, logPath)
                : join(cwd, logPath, 'app.log');

            transport = pino.transport({
                target: 'pino/file',
                options: { destination, mkdir: true }
            });
        } else if (isPretty) {
            // 12-Factor Mode: Pretty Stdout (Development)
            transport = pino.transport({
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname',
                }
            });
        }

        // 3. Initialize Pino instance
        this.logger = pino({
            level: logLevel,
        }, transport);
    }

    public info(message: string, context?: any): void {
        this.logger.info(context || {}, message);
    }

    public warn(message: string, context?: any): void {
        this.logger.warn(context || {}, message);
    }

    public error(message: string, context?: any): void {
        this.logger.error(context || {}, message);
    }

    public debug(message: string, context?: any): void {
        this.logger.debug(context || {}, message);
    }

    public child(context: any): ILogger {
        return new PinoLogger({ _instance: this.logger.child(context) } as any);
    }
}
