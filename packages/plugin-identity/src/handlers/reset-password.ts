import type { IDatabaseAdapter, ILogger, JsonRequest, JsonResponse } from '@json-express/core';
import { hashPassword, hashRandomToken } from '../crypto';

interface ResetPasswordDeps {
    db: IDatabaseAdapter;
    minPasswordLength: number;
    logger: ILogger;
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
        const matches = await deps.db.search('passwordResetTokens', { tokenHash });
        const record = matches?.[0];
        if (!record || new Date(record.expiresAt).getTime() < Date.now()) {
            deps.logger.warn('Reset failed — token unknown or expired');
            return GENERIC_ERROR;
        }

        const user = await deps.db.getById('users', record.userId).catch(() => null);
        if (!user) {
            deps.logger.warn('Reset failed — user no longer exists', { userId: record.userId });
            return GENERIC_ERROR;
        }

        const passwordHash = await hashPassword(newPassword);
        await deps.db.update('users', String(user.id), { passwordHash });

        // Defense: a successful reset implies the old credentials may have been compromised.
        // Revoke every refresh token currently issued for this user — they must re-login everywhere.
        const sessions = await deps.db.search('refreshTokens', { userId: String(user.id) });
        for (const s of sessions ?? []) {
            if (!s.revoked) {
                await deps.db.update('refreshTokens', String(s.id), { revoked: true });
            }
        }

        // Single-use: consume the reset token.
        await deps.db.delete('passwordResetTokens', String(record.id));

        deps.logger.info('Password reset complete', { userId: user.id, sessionsRevoked: sessions?.length ?? 0 });
        return { statusCode: 200, body: { ok: true } };
    };
}
