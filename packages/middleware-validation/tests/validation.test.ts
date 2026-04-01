import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { ValidationMiddleware } from '../src/index';
import type { JsonRequest, JsonResponse, IConfigProvider } from '@json-express/core';

describe('Validation Middleware', () => {
    const runMiddleware = async (
        rules: any[],
        req: JsonRequest
    ): Promise<JsonResponse> => {
        const configProvider: IConfigProvider = {
            get: (key: string, def?: any) => key === 'validation.rules' ? rules : def,
            has: (key: string) => key === 'validation.rules'
        };

        const middleware = new ValidationMiddleware({ configProvider });
        return middleware.handle(req, async () => ({
            statusCode: 200,
            body: { success: true }
        }));
    };

    const makeReq = (method: string, path: string, body?: any, query?: any): JsonRequest => ({
        method,
        path,
        body: body || {},
        query: query || {},
        params: {},
        headers: {}
    });

    const artistSchema = z.object({
        name: z.string(),
        genre: z.string().optional()
    });

    const testRules = [
        {
            method: 'POST',
            path: '/api/artists',
            body: artistSchema,
        },
        {
            method: '*',
            path: /^\/api\/custom\/.*/,
            query: z.object({ limit: z.string() })
        }
    ];

    it('should bypass requests that do not match any rules', async () => {
        const res = await runMiddleware(testRules, makeReq('GET', '/api/artists'));
        expect(res.statusCode).toBe(200);
    });

    it('should return 400 Bad Request on invalid POST body', async () => {
        // Missing name
        const req = makeReq('POST', '/api/artists', { genre: 'Rock' });
        const res = await runMiddleware(testRules, req);
        
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Validation failed');
        expect(res.body.details.body).toBeDefined();
        // Zod format returns _errors at the top level and field specific
        expect(res.body.details.body.name._errors).toContain('Required');
    });

    it('should allow valid POST body to pass through', async () => {
        const req = makeReq('POST', '/api/artists', { name: 'Adele' });
        const res = await runMiddleware(testRules, req);
        
        expect(res.statusCode).toBe(200);
        expect(req.body.name).toBe('Adele'); // Values should be parsed/persisted
    });

    it('should match regex path patterns correctly with valid query', async () => {
        const req = makeReq('GET', '/api/custom/123', {}, { limit: '10' });
        const res = await runMiddleware(testRules, req);
        expect(res.statusCode).toBe(200);
    });

    it('should return 400 Bad Request if query regex match is invalid', async () => {
        // Missing "limit" query
        const req = makeReq('GET', '/api/custom/123');
        const res = await runMiddleware(testRules, req);
        expect(res.statusCode).toBe(400);
        expect(res.body.details.query).toBeDefined();
    });

    it('should successfully mutate req by stripping unexpected fields via standard safeParse', async () => {
        // Zod strips unknown keys by default
        const req = makeReq('POST', '/api/artists', { name: 'Adele', foo: 'bar' });
        await runMiddleware(testRules, req);
        expect(req.body).toEqual({ name: 'Adele' }); 
    });
});
