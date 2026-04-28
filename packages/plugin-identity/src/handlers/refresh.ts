import type { IDatabaseAdapter, IKvStore, ILogger, JsonRequest, JsonResponse } from '@json-express/core';
import { signAccessToken, type JwtIssuerConfig } from '../jwt-issuer';
import { generateRandomToken, hashRandomToken } from '../crypto';

interface RefreshDeps {
    db: IDatabaseAdapter;
    kvStore: IKvStore;
    issuer: JwtIssuerConfig;
    refreshTtlMs: number;
    logger: ILogger;
}

interface RefreshSession {
    userId: string;
    version: number;
}

const GENERIC_REFRESH_ERROR = { statusCode: 401, body: { error: 'Invalid or expired refresh token' } } as const;

export function makeRefreshHandler(deps: RefreshDeps) {
    return async (req: JsonRequest): Promise<JsonResponse> => {
        const { refreshToken } = req.body ?? {};
        if (typeof refreshToken !== 'string' || !refreshToken) {
            return { statusCode: 400, body: { error: 'refreshToken is required' } };
        }

        const tokenHash = hashRandomToken(refreshToken);
        const session = await deps.kvStore.get<RefreshSession>(`rt:${tokenHash}`);
        if (!session) {
            deps.logger.warn('Refresh failed — token unknown or expired');
            return GENERIC_REFRESH_ERROR;
        }

        const user = await deps.db.getById('users', session.userId).catch(() => null);
        if (!user) {
            deps.logger.warn('Refresh failed — user no longer exists', { userId: session.userId });
            await deps.kvStore.delete(`rt:${tokenHash}`);
            return GENERIC_REFRESH_ERROR;
        }

        // Token-version check: a password reset/change since this token was issued
        // bumps user.tokenVersion. Mismatched tokens are cryptographically dead.
        if ((user.tokenVersion ?? 0) !== session.version) {
            deps.logger.warn('Refresh failed — tokenVersion mismatch (password reset/change)', { userId: user.id });
            await deps.kvStore.delete(`rt:${tokenHash}`);
            return GENERIC_REFRESH_ERROR;
        }

        // Rotation: invalidate the used token, issue a new pair.
        await deps.kvStore.delete(`rt:${tokenHash}`);

        const newRefresh = generateRandomToken();
        const newHash = hashRandomToken(newRefresh);
        await deps.kvStore.set(
            `rt:${newHash}`,
            { userId: String(user.id), version: user.tokenVersion ?? 0 },
            { ttlMs: deps.refreshTtlMs }
        );

        const accessToken = signAccessToken(
            {
                sub: String(user.id),
                role: user.role ?? 'user',
                email: user.email,
                emailVerified: !!user.emailVerified,
            },
            deps.issuer
        );

        deps.logger.info('Token refreshed', { userId: user.id });
        return {
            statusCode: 200,
            body: {
                accessToken,
                refreshToken: newRefresh,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role ?? 'user',
                    emailVerified: !!user.emailVerified,
                },
            },
        };
    };
}
