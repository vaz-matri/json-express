import { describe, it, expect, vi } from 'vitest';
import { AuthMiddleware } from '../src/index';
import type { JsonRequest, JsonResponse, IConfigProvider } from '@json-express/core';
import jwt from 'jsonwebtoken';

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

        const middleware = new AuthMiddleware({ configProvider });
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
