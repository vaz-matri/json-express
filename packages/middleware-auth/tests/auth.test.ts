import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { AuthMiddleware } from '../src/index';
import type { JsonRequest, JsonResponse, IConfigProvider } from '@json-express/core';
import jwt from 'jsonwebtoken';
import { createServer, type Server } from 'http';
import { generateKeyPairSync, randomUUID, type KeyObject } from 'crypto';
import type { AddressInfo } from 'net';


const mockLogger: any = {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    child: () => mockLogger
};

describe('Auth Middleware', () => {
    // Utility to run the middleware
    const runMiddleware = async (
        provider: Record<string, any>,
        req: JsonRequest
    ): Promise<JsonResponse> => {
        const configProvider: IConfigProvider = {
            get: (key: string, def?: any) => provider[key] ?? def,
            has: (key: string) => key in provider
        };

        const middleware = new AuthMiddleware({  configProvider , logger: mockLogger });
        return middleware.handle(req, async () => ({
            statusCode: 200,
            body: { success: true }
        }));
    };

    const makeReq = (path: string, authHeader?: string): JsonRequest => ({
        method: 'GET',
        path,
        body: {},
        query: {},
        params: {},
        headers: authHeader ? { authorization: authHeader } : {}
    });

    it('should bypass auth completely to prevent hard-crashing if JEX_AUTH_SECRET is omitted', async () => {
        const res = await runMiddleware({}, makeReq('/api/v1/artists'));
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should bypass auth if path matches array config exclusion', async () => {
        const res = await runMiddleware({
            'auth.secret': 'super-secret',
            'auth.exclude': ['/public', '/api/v1/health']
        }, makeReq('/api/v1/health'));

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should bypass auth if path matches comma-separated string exclusion', async () => {
        const res = await runMiddleware({
            'auth.secret': 'super-secret',
            'auth.exclude': '/docs, /public, /api/auth'
        }, makeReq('/public/images/logo.png'));

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return 401 if token is missing on protected route', async () => {
        const res = await runMiddleware({
            'auth.secret': 'super-secret'
        }, makeReq('/api/v1/artists'));

        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({ error: 'Unauthorized: Missing or invalid Bearer token.' });
    });

    it('should return 401 if token is malformed', async () => {
        const res = await runMiddleware({
            'auth.secret': 'super-secret'
        }, makeReq('/api/v1/artists', 'Basic username:password'));

        expect(res.statusCode).toBe(401);
    });

    it('should return 403 if token is invalid or expired', async () => {
        const res = await runMiddleware({
            'auth.secret': 'super-secret'
        }, makeReq('/api/v1/artists', 'Bearer completely-fake-token'));

        expect(res.statusCode).toBe(403);
        expect(res.body).toEqual({ error: 'Forbidden: Invalid or expired token.' });
    });

    it('should allow access and set x-user-payload if token is valid', async () => {
        const token = jwt.sign({ sub: 'user-123' }, 'super-secret', { expiresIn: '1h' });
        const req = makeReq('/api/v1/artists', `Bearer ${token}`);

        const res = await runMiddleware({
            'auth.secret': 'super-secret'
        }, req);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);

        const payload = JSON.parse(req.headers['x-user-payload'] as string);
        expect(payload.sub).toBe('user-123');
    });
});

// ─────────────────────────  JWKS wiring  ─────────────────────────
//
// Confirms middleware-auth correctly hands jwksUri/audience/issuer/algorithms
// from configProvider into createJwtVerifier — the integration the original
// JWKS plan called for but only the core unit tests covered.

interface TestJwks {
    server: Server;
    url: string;
    privateKey: KeyObject;
    kid: string;
}

async function startJwksServer(): Promise<TestJwks> {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const kid = randomUUID();
    const jwk = {
        ...publicKey.export({ format: 'jwk' }),
        kid,
        alg: 'RS256',
        use: 'sig',
    };
    const server = createServer((req, res) => {
        if (req.url === '/.well-known/jwks.json') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ keys: [jwk] }));
            return;
        }
        res.writeHead(404);
        res.end();
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as AddressInfo).port;
    return { server, url: `http://127.0.0.1:${port}/.well-known/jwks.json`, privateKey, kid };
}

describe('Auth Middleware — JWKS configuration', () => {
    let jwks: TestJwks;

    beforeAll(async () => { jwks = await startJwksServer(); });
    afterAll(async () => { await new Promise<void>((resolve) => jwks.server.close(() => resolve())); });

    const runWithConfig = async (config: Record<string, any>, authHeader?: string) => {
        const provider: IConfigProvider = {
            get: (k, d) => (k in config ? config[k] : d) as any,
            has: (k) => k in config,
            set: () => {},
        };
        const middleware = new AuthMiddleware({  configProvider: provider , logger: mockLogger });
        const req: JsonRequest = {
            method: 'GET', path: '/api/v1/data', body: {}, query: {}, params: {},
            headers: authHeader ? { authorization: authHeader } : {},
        };
        return middleware.handle(req, async () => ({ statusCode: 200, body: { ok: true } }));
    };

    it('verifies an RS256 token via jwksUri', async () => {
        const token = jwt.sign({ sub: 'jwks-user' }, jwks.privateKey, {
            algorithm: 'RS256', keyid: jwks.kid,
        });
        const res = await runWithConfig({ 'auth.jwksUri': jwks.url }, `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
    });

    it('returns 403 when the token signature does not match the JWKS', async () => {
        const { privateKey: otherKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
        const token = jwt.sign({ sub: 'evil' }, otherKey, {
            algorithm: 'RS256', keyid: jwks.kid,
        });
        const res = await runWithConfig({ 'auth.jwksUri': jwks.url }, `Bearer ${token}`);
        expect(res.statusCode).toBe(403);
    });

    it('returns 401 when no Bearer header is present (auth still configured)', async () => {
        const res = await runWithConfig({ 'auth.jwksUri': jwks.url });
        expect(res.statusCode).toBe(401);
    });

    it('throws at construction when both auth.secret and auth.jwksUri are set', () => {
        const provider: IConfigProvider = {
            get: (k, d) => (k === 'auth.secret' ? 'x' : k === 'auth.jwksUri' ? jwks.url : d) as any,
            has: (k) => k === 'auth.secret' || k === 'auth.jwksUri',
            set: () => {},
        };
        expect(() => new AuthMiddleware({  configProvider: provider , logger: mockLogger })).toThrow(/both/i);
    });

    it('rejects tokens with audience mismatch when auth.audience is set', async () => {
        const ok = jwt.sign({ sub: 'a' }, jwks.privateKey, {
            algorithm: 'RS256', keyid: jwks.kid, audience: 'my-api',
        });
        const bad = jwt.sign({ sub: 'a' }, jwks.privateKey, {
            algorithm: 'RS256', keyid: jwks.kid, audience: 'other-api',
        });
        const okRes = await runWithConfig(
            { 'auth.jwksUri': jwks.url, 'auth.audience': 'my-api' },
            `Bearer ${ok}`
        );
        expect(okRes.statusCode).toBe(200);
        const badRes = await runWithConfig(
            { 'auth.jwksUri': jwks.url, 'auth.audience': 'my-api' },
            `Bearer ${bad}`
        );
        expect(badRes.statusCode).toBe(403);
    });
});
