import { describe, it, expect, afterEach } from 'vitest';
import net from 'net';
import { ExpressTransport } from '../src/index';
import type { IConfigProvider, ILogger } from '@json-express/core';

const silentLogger: ILogger = {
    info: () => {}, warn: () => {}, error: () => {}, debug: () => {}, child: () => silentLogger,
};

function cfg(values: Record<string, any>): IConfigProvider {
    return { get: (k: string, d?: any) => (k in values ? values[k] : d), has: (k) => k in values, set: () => {} };
}

async function freePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const s = net.createServer();
        s.once('error', reject);
        s.listen(0, () => {
            const addr = s.address();
            s.close(() => (addr && typeof addr === 'object' ? resolve(addr.port) : reject(new Error('no port'))));
        });
    });
}

let active: ExpressTransport | null = null;
afterEach(async () => { await active?.stop().catch(() => {}); active = null; });

async function bootWithThrowingRoute(config: IConfigProvider) {
    const t = new ExpressTransport({ configProvider: config, logger: silentLogger });
    active = t;
    t.registerRoute({ method: 'GET', path: '/boom', handler: async () => { throw new Error('secret-internal-detail'); } });
    const port = await freePort();
    await t.start(port);
    return port;
}

describe('transport-express error masking', () => {
    it('masks the 500 message in production and includes a traceId', async () => {
        const port = await bootWithThrowingRoute(cfg({ mode: 'production' }));
        const res = await fetch(`http://127.0.0.1:${port}/boom`);
        expect(res.status).toBe(500);
        const body: any = await res.json();
        expect(body.error).toBe('Internal Server Error');
        expect(body.error).not.toContain('secret-internal-detail');
        expect(typeof body.traceId).toBe('string');
    });

    it('shows the real message in development', async () => {
        const port = await bootWithThrowingRoute(cfg({ mode: 'development' }));
        const res = await fetch(`http://127.0.0.1:${port}/boom`);
        expect(res.status).toBe(500);
        const body: any = await res.json();
        expect(body.error).toContain('secret-internal-detail');
    });
});
