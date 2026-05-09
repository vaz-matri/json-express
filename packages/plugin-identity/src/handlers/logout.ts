import type { IKvStore, ILogger, JsonRequest, JsonResponse } from '@json-express/core';
import { hashRandomToken } from '../crypto';

interface LogoutDeps {
    kvStore: IKvStore;
    logger: ILogger;
}

export function makeLogoutHandler(deps: LogoutDeps) {
    return async (req: JsonRequest): Promise<JsonResponse> => {
        const { refreshToken } = req.body ?? {};
        if (typeof refreshToken === 'string' && refreshToken) {
            const tokenHash = hashRandomToken(refreshToken);
            await deps.kvStore.delete(`rt:${tokenHash}`);
            deps.logger.info('Logout — refresh token revoked');
        }
        // Idempotent: never leak whether the token existed.
        return { statusCode: 200, body: { ok: true } };
    };
}
