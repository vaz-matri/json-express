import { describe, it, expect, vi } from 'vitest';
import type { ILogger, IConfigProvider } from '@json-express/core';
import { ConsoleEmailProvider } from '../src/index';

function fakeLogger(): ILogger & { calls: any[] } {
    const calls: any[] = [];
    const logger: any = {
        info: (msg: string, ctx?: any) => calls.push({ level: 'info', msg, ctx }),
        warn: (msg: string, ctx?: any) => calls.push({ level: 'warn', msg, ctx }),
        error: (msg: string, ctx?: any) => calls.push({ level: 'error', msg, ctx }),
        debug: (msg: string, ctx?: any) => calls.push({ level: 'debug', msg, ctx }),
        child: () => logger,
    };
    logger.calls = calls;
    return logger;
}

function fakeConfig(values: Record<string, any> = {}): IConfigProvider {
    return {
        get: (k, d) => (k in values ? values[k] : d) as any,
        has: (k) => k in values,
        set: (k, v) => { values[k] = v; },
    };
}

describe('ConsoleEmailProvider', () => {
    it('logs to the configured logger', async () => {
        const logger = fakeLogger();
        const provider = new ConsoleEmailProvider({ logger });
        await provider.send({
            to: 'user@example.com',
            subject: 'Hello',
            text: 'Hello world',
        });
        expect(logger.calls).toHaveLength(1);
        expect(logger.calls[0].level).toBe('info');
        expect(logger.calls[0].msg).toContain('user@example.com');
        expect(logger.calls[0].msg).toContain('Hello world');
        expect(logger.calls[0].ctx.to).toBe('user@example.com');
        expect(logger.calls[0].ctx.subject).toBe('Hello');
        expect(logger.calls[0].ctx.text).toBe('Hello world');
    });

    it('falls back to the configured default From when message.from is omitted', async () => {
        const logger = fakeLogger();
        const provider = new ConsoleEmailProvider({
            logger,
            configProvider: fakeConfig({ 'email.from': 'app@example.com' }),
        });
        await provider.send({ to: 'a@b.c', subject: 'x', text: 'y' });
        expect(logger.calls[0].ctx.from).toBe('app@example.com');
    });

    it('honors message.from when provided', async () => {
        const logger = fakeLogger();
        const provider = new ConsoleEmailProvider({ logger });
        await provider.send({ to: 'a@b.c', from: 'override@x.y', subject: 'x', text: 'y' });
        expect(logger.calls[0].ctx.from).toBe('override@x.y');
    });

    it('throws when neither text nor html is provided', async () => {
        const provider = new ConsoleEmailProvider({ logger: fakeLogger() });
        await expect(provider.send({ to: 'a@b.c', subject: 'x' })).rejects.toThrow(/text.*html/i);
    });

    it('joins array recipients into a single line', async () => {
        const logger = fakeLogger();
        const provider = new ConsoleEmailProvider({ logger });
        await provider.send({ to: ['a@x.y', 'b@x.y'], subject: 's', text: 't' });
        expect(logger.calls[0].msg).toContain('a@x.y, b@x.y');
    });

    it('isHealthy resolves true', async () => {
        const provider = new ConsoleEmailProvider({});
        expect(await provider.isHealthy()).toBe(true);
    });
});
