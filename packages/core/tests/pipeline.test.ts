import { describe, it, expect, vi } from 'vitest';
import { composeMiddlewares } from '../src/pipeline';
import type { JsonRequest, JsonResponse, IMiddleware } from '../src/types';

describe('Middleware Pipeline', () => {
    it('should execute middlewares in the correct order and pass down the request', async () => {
        const logs: string[] = [];

        const mw1: IMiddleware = {
            name: 'mw1',
            async handle(req, next) {
                logs.push('mw1 - start');
                const res = await next();
                logs.push('mw1 - end');
                return res;
            }
        };

        const mw2: IMiddleware = {
            name: 'mw2',
            async handle(req, next) {
                logs.push('mw2 - start');
                req.headers['x-custom'] = 'true';
                const res = await next();
                res.headers = { ...res.headers, 'x-appended': '123' };
                logs.push('mw2 - end');
                return res;
            }
        };

        const handler = async (req: JsonRequest): Promise<JsonResponse> => {
            logs.push('handler executed');
            return {
                statusCode: 200,
                body: { success: true },
                headers: { 'x-base': 'true' }
            };
        };

        const wrapped = composeMiddlewares(handler, [mw1, mw2]);

        const req: JsonRequest = {
            body: {},
            query: {},
            params: {},
            headers: {}
        };

        const res = await wrapped(req);

        // Verify Execution Order
        expect(logs).toEqual([
            'mw1 - start',
            'mw2 - start',
            'handler executed',
            'mw2 - end',
            'mw1 - end'
        ]);

        // Verify request mutation
        expect(req.headers['x-custom']).toBe('true');

        // Verify response payload
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);

        // Verify response headermutation
        expect(res.headers).toEqual({
            'x-base': 'true',
            'x-appended': '123'
        });
    });

    it('should throw an error if next is called multiple times', async () => {
        const mw: IMiddleware = {
            name: 'bad-mw',
            async handle(req, next) {
                await next();
                await next();
                return { statusCode: 200 };
            }
        };

        const handler = async () => ({ statusCode: 200 });
        const wrapped = composeMiddlewares(handler, [mw]);

        const req: JsonRequest = { body: {}, query: {}, params: {}, headers: {} };
        await expect(wrapped(req)).rejects.toThrow('next() called multiple times');
    });
});
