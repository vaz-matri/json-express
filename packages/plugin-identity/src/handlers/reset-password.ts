import type { IDatabaseAdapter, IKvStore, ILogger, JsonRequest, JsonResponse } from '@json-express/core';
import { hashPassword, hashRandomToken } from '../crypto';

interface ResetPasswordDeps {
    db: IDatabaseAdapter;
    kvStore: IKvStore;
    minPasswordLength: number;
    logger: ILogger;
}

interface ResetRecord {
    userId: string;
}

const GENERIC_ERROR = { statusCode: 400, body: { error: 'Invalid or expired reset token' } } as const;

export function makeResetPasswordHandler(deps: ResetPasswordDeps) {
    return async (req: JsonRequest): Promise<JsonResponse> => {
        const { token, newPassword } = req.body ?? {};
        if (typeof token !== 'string' || !token || typeof newPassword !== 'string' || !newPassword) {
            return { statusCode: 400, body: { error: 'token and newPassword are required' } };
        }
        if (newPassword.length < deps.minPasswordLength) {
            return { statusCode: 400, body: { error: `password must be at least ${deps.minPasswordLength} characters` } };
        }

        const tokenHash = hashRandomToken(token);
        const record = await deps.kvStore.get<ResetRecord>(`prt:${tokenHash}`);
        if (!record) {
            deps.logger.warn('Reset failed — token unknown or expired');
            return GENERIC_ERROR;
        }

        const user = await deps.db.getById('users', record.userId).catch(() => null);
        if (!user) {
            deps.logger.warn('Reset failed — user no longer exists', { userId: record.userId });
            await deps.kvStore.delete(`prt:${tokenHash}`);
            return GENERIC_ERROR;
        }

        const passwordHash = await hashPassword(newPassword);
        // Bump tokenVersion to invalidate every outstanding refresh token issued
        // before this reset — they'll fail the version check in /auth/refresh.
        await deps.db.update('users', String(user.id), {
            passwordHash,
            requirePasswordReset: false,
            tokenVersion: (user.tokenVersion ?? 0) + 1,
        });

        // Single-use: consume the reset token.
        await deps.kvStore.delete(`prt:${tokenHash}`);

        deps.logger.info('Password reset complete', { userId: user.id });
        return { statusCode: 200, body: { ok: true } };
    };
}
