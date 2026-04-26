import type { IDatabaseAdapter, ILogger, JsonRequest, JsonResponse } from '@json-express/core';
import { hashRandomToken } from '../crypto';

interface LogoutDeps {
    db: IDatabaseAdapter;
    logger: ILogger;
}

export function makeLogoutHandler(deps: LogoutDeps) {
    return async (req: JsonRequest): Promise<JsonResponse> => {
        const { refreshToken } = req.body ?? {};
        if (typeof refreshToken === 'string' && refreshToken) {
            const tokenHash = hashRandomToken(refreshToken);
            const matches = await deps.db.search('refreshTokens', { tokenHash });
            const record = matches?.[0];
            if (record && !record.revoked) {
                await deps.db.update('refreshTokens', String(record.id), { revoked: true });
                deps.logger.info('Logout — refresh token revoked', { userId: record.userId });
            }
        }
        // Idempotent: never leak whether the token existed.
        return { statusCode: 200, body: { ok: true } };
    };
}
