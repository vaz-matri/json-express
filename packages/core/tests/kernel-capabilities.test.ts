import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JsonExpressKernel } from '../src/kernel';
import { FatalBootError } from '../src/errors';
import type { ILogger, IMiddleware, IPlugin, JsonRequest, JsonResponse } from '../src/types';

const noopLogger: ILogger = {
    info: () => {}, warn: () => {}, error: () => {}, debug: () => {},
    child: () => noopLogger,
};

// A plugin that hard-requires the 'ratelimit' capability.
const identityLike: IPlugin = {
    name: 'plugin-identity',
    requires: [{ capability: 'ratelimit', reason: 'login endpoints must be rate limited.' }],
    onBoot: async () => {},
};

// A middleware that provides it.
const ratelimitLike: IMiddleware = {
    name: 'ratelimit',
    provides: ['ratelimit'],
    handle: (_req: JsonRequest, next: () => Promise<JsonResponse>) => next(),
};

describe('kernel capability validation', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('aborts boot with FatalBootError when a required capability has no provider', async () => {
        const kernel = new JsonExpressKernel();
        kernel.registerLogger(noopLogger);
        kernel.registerPlugin(identityLike);

        await expect(kernel.boot(['anything'])).rejects.toBeInstanceOf(FatalBootError);
    });

    it('names the requiring package and capability in the remedy', async () => {
        const kernel = new JsonExpressKernel();
        kernel.registerLogger(noopLogger);
        kernel.registerPlugin(identityLike);

        await expect(kernel.boot(['anything'])).rejects.toMatchObject({
            message: expect.stringContaining("'plugin-identity' requires the 'ratelimit' capability"),
            remedy: expect.stringContaining('ratelimit'),
        });
    });

    it('passes capability validation when a provider is registered (fails later, not on capabilities)', async () => {
        const kernel = new JsonExpressKernel();
        kernel.registerLogger(noopLogger);
        kernel.registerPlugin(identityLike);
        kernel.registerMiddleware(ratelimitLike);

        // Capability check passes; boot then fails resolving the (unregistered) database —
        // a different error, proving the veto did not fire.
        await expect(kernel.boot(['anything'])).rejects.not.toBeInstanceOf(FatalBootError);
    });
});
