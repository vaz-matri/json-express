import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { ValidationMiddleware } from '../src/index';
import type { JsonRequest, JsonResponse, IConfigProvider } from '@json-express/core';


const mockLogger: any = {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    child: () => mockLogger
};

describe('Validation Middleware', () => {
    const runMiddleware = async (
        schemas: ModelSchema[],
        req: JsonRequest
    ): Promise<JsonResponse> => {
        const middleware = new ValidationMiddleware({ logger: mockLogger });
        middleware.setSchemas(schemas);
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

    const testSchemas: ModelSchema[] = [
        {
            name: 'artists',
            fields: {},
            validation: {
                create: { body: artistSchema }
            }
        },
        {
            name: 'custom',
            fields: {},
            endpoints: {
                'GET /123': {
                    handler: async () => ({ statusCode: 200 }),
                    validation: { query: z.object({ limit: z.string() }) }
                }
            }
        }
    ];

    it('should bypass requests that do not match any rules', async () => {
        const res = await runMiddleware(testSchemas, makeReq('GET', '/artists'));
        expect(res.statusCode).toBe(200);
    });

    it('should return 400 Bad Request on invalid POST body', async () => {
        // Missing name
        const req = makeReq('POST', '/artists', { genre: 'Rock' });
        const res = await runMiddleware(testSchemas, req);
        
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Validation failed');
        expect(res.body.details.body).toBeDefined();
        // Zod format returns _errors at the top level and field specific
        expect(res.body.details.body.name._errors).toContain('Required');
    });

    it('should allow valid POST body to pass through', async () => {
        const req = makeReq('POST', '/artists', { name: 'Adele' });
        const res = await runMiddleware(testSchemas, req);
        
        expect(res.statusCode).toBe(200);
        expect(req.body.name).toBe('Adele'); // Values should be parsed/persisted
    });

    it('should match regex path patterns correctly with valid query', async () => {
        const req = makeReq('GET', '/custom/123', {}, { limit: '10' });
        const res = await runMiddleware(testSchemas, req);
        expect(res.statusCode).toBe(200);
    });

    it('should return 400 Bad Request if query regex match is invalid', async () => {
        // Missing "limit" query
        const req = makeReq('GET', '/custom/123');
        const res = await runMiddleware(testSchemas, req);
        expect(res.statusCode).toBe(400);
        expect(res.body.details.query).toBeDefined();
    });

    it('should successfully mutate req by stripping unexpected fields via standard safeParse', async () => {
        // Zod strips unknown keys by default
        const req = makeReq('POST', '/artists', { name: 'Adele', foo: 'bar' });
        await runMiddleware(testSchemas, req);
        expect(req.body).toEqual({ name: 'Adele' }); 
    });
});
