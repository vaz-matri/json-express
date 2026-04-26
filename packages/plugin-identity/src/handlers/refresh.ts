import type { IDatabaseAdapter, ILogger, JsonRequest, JsonResponse } from '@json-express/core';
import { signAccessToken, type JwtIssuerConfig } from '../jwt-issuer';
import { generateRefreshToken, hashRefreshToken } from '../crypto';

interface RefreshDeps {
    db: IDatabaseAdapter;
    issuer: JwtIssuerConfig;
    refreshTtlMs: number;
    logger: ILogger;
}

const GENERIC_REFRESH_ERROR = { statusCode: 401, body: { error: 'Invalid or expired refresh token' } } as const;

export function makeRefreshHandler(deps: RefreshDeps) {
    return async (req: JsonRequest): Promise<JsonResponse> => {
        const { refreshToken } = req.body ?? {};
        if (typeof refreshToken !== 'string' || !refreshToken) {
            return { statusCode: 400, body: { error: 'refreshToken is required' } };
        }

        const tokenHash = hashRefreshToken(refreshToken);
        const matches = await deps.db.search('refreshTokens', { tokenHash });
        const record = matches?.[0];
        if (!record || record.revoked || new Date(record.expiresAt).getTime() < Date.now()) {
            deps.logger.warn('Refresh failed — token unknown/revoked/expired');
            return GENERIC_REFRESH_ERROR;
        }

        const user = await deps.db.getById('users', record.userId).catch(() => null);
        if (!user) {
            deps.logger.warn('Refresh failed — user no longer exists', { userId: record.userId });
            return GENERIC_REFRESH_ERROR;
        }

        // Rotation: revoke the used token, issue a new pair.
        await deps.db.update('refreshTokens', String(record.id), { revoked: true });

        const newRefresh = generateRefreshToken();
        const newExpiresAt = new Date(Date.now() + deps.refreshTtlMs).toISOString();
        await deps.db.create('refreshTokens', {
            userId: String(user.id),
            tokenHash: hashRefreshToken(newRefresh),
            expiresAt: newExpiresAt,
            revoked: false,
            createdAt: new Date().toISOString(),
        });

        const accessToken = signAccessToken(
            { sub: String(user.id), role: user.role ?? 'user', email: user.email },
            deps.issuer
        );

        deps.logger.info('Token refreshed', { userId: user.id });
        return {
            statusCode: 200,
            body: {
                accessToken,
                refreshToken: newRefresh,
                user: { id: user.id, email: user.email, role: user.role ?? 'user' },
            },
        };
    };
}
