import { describe, it, expect } from 'vitest';
import { RateLimitMiddleware } from '../src/index';
import type { IConfigProvider, IKvStore, JsonRequest, JsonResponse } from '@json-express/core';

const mockLogger: any = {
    info: () => {}, warn: () => {}, error: () => {}, debug: () => {}, child: () => mockLogger,
};

function makeConfig(values: Record<string, any>): IConfigProvider {
    return {
        get: (k: string, d?: any) => (k in values ? values[k] : d),
        has: (k: string) => k in values,
        set: () => {},
    };
}

const makeReq = (ip: string, path = '/things', headers: Record<string, any> = {}): JsonRequest =>
    ({ method: 'GET', path, body: undefined, query: {}, params: {}, headers, ip } as any);

const okNext = async (): Promise<JsonResponse> => ({ statusCode: 200, body: { ok: true } });

// A large window keeps every request inside one window so counts accumulate deterministically.
const cfg = (over: Record<string, any> = {}) =>
    makeConfig({ 'ratelimit.window': 100000, 'ratelimit.max': 3, ...over });

describe('RateLimitMiddleware (in-memory fallback)', () => {
    it('allows up to max, then returns 429', async () => {
        const rl = new RateLimitMiddleware({ configProvider: cfg(), logger: mockLogger });
        const req = makeReq('1.1.1.1');

        for (let i = 0; i < 3; i++) {
            expect((await rl.handle(req, okNext)).statusCode).toBe(200);
        }
        const blocked = await rl.handle(req, okNext);
        expect(blocked.statusCode).toBe(429);
        expect(blocked.headers?.['Retry-After']).toBeDefined();
    });

    it('sets X-RateLimit headers on allowed responses', async () => {
        const rl = new RateLimitMiddleware({ configProvider: cfg(), logger: mockLogger });
        const res = await rl.handle(makeReq('2.2.2.2'), okNext);
        expect(res.headers?.['X-RateLimit-Limit']).toBe('3');
        expect(res.headers?.['X-RateLimit-Remaining']).toBe('2');
    });

    it('tracks clients independently', async () => {
        const rl = new RateLimitMiddleware({ configProvider: cfg(), logger: mockLogger });
        for (let i = 0; i < 3; i++) await rl.handle(makeReq('3.3.3.3'), okNext);
        // A different IP still has a full budget.
        expect((await rl.handle(makeReq('4.4.4.4'), okNext)).statusCode).toBe(200);
    });

    it('bypasses excluded path prefixes', async () => {
        const rl = new RateLimitMiddleware({ configProvider: cfg({ 'ratelimit.exclude': '/health' }), logger: mockLogger });
        const req = makeReq('5.5.5.5', '/health');
        for (let i = 0; i < 10; i++) {
            expect((await rl.handle(req, okNext)).statusCode).toBe(200);
        }
    });

    it('ignores X-Forwarded-For unless trustproxy is enabled', async () => {
        const rl = new RateLimitMiddleware({ configProvider: cfg(), logger: mockLogger });
        // Same socket IP, different spoofed XFF each time — must all count against one bucket.
        for (let i = 0; i < 3; i++) {
            await rl.handle(makeReq('6.6.6.6', '/things', { 'x-forwarded-for': `9.9.9.${i}` }), okNext);
        }
        const blocked = await rl.handle(makeReq('6.6.6.6', '/things', { 'x-forwarded-for': '9.9.9.99' }), okNext);
        expect(blocked.statusCode).toBe(429);
    });

    it('keys on X-Forwarded-For when trustproxy is enabled', async () => {
        const rl = new RateLimitMiddleware({ configProvider: cfg({ 'ratelimit.trustproxy': true }), logger: mockLogger });
        // Same socket IP but distinct trusted client IPs → independent buckets.
        for (let i = 0; i < 3; i++) {
            await rl.handle(makeReq('7.7.7.7', '/things', { 'x-forwarded-for': '8.8.8.8' }), okNext);
        }
        const other = await rl.handle(makeReq('7.7.7.7', '/things', { 'x-forwarded-for': '8.8.8.9' }), okNext);
        expect(other.statusCode).toBe(200);
    });
});

describe('RateLimitMiddleware (KV backend)', () => {
    it('uses the shared KV store when provided via setHookContext', async () => {
        const store = new Map<string, any>();
        const kv: IKvStore = {
            get: async (k) => (store.has(k) ? store.get(k) : null),
            set: async (k, v) => { store.set(k, v); },
            delete: async (k) => { store.delete(k); },
        };
        const rl = new RateLimitMiddleware({ configProvider: cfg(), logger: mockLogger });
        rl.setHookContext({ db: {} as any, kvStore: kv, logger: mockLogger });

        for (let i = 0; i < 3; i++) await rl.handle(makeReq('1.2.3.4'), okNext);
        expect((await rl.handle(makeReq('1.2.3.4'), okNext)).statusCode).toBe(429);
        // Count landed in the shared store, not the in-process map.
        expect([...store.keys()].some(k => k.startsWith('rl:1.2.3.4:'))).toBe(true);
    });
});
