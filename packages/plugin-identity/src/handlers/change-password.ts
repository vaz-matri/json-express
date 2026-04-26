import type { IDatabaseAdapter, ILogger, JsonRequest, JsonResponse, JwtVerifier } from '@json-express/core';
import { hashPassword, verifyPassword } from '../crypto';

interface ChangePasswordDeps {
    db: IDatabaseAdapter;
    /** Verifier constructed from the same config middleware-auth uses. */
    verifier: JwtVerifier;
    minPasswordLength: number;
    logger: ILogger;
}

function decodeUserPayload(raw: string | null): Record<string, any> | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
}

export function makeChangePasswordHandler(deps: ChangePasswordDeps) {
    return async (req: JsonRequest): Promise<JsonResponse> => {
        // The route bypasses the kernel's middleware composition (it's registered
        // directly via transport), so we must verify the Bearer token ourselves —
        // and not trust any client-provided x-user-payload.
        const verified = await deps.verifier(req.headers['authorization']);
        const payload = decodeUserPayload(verified);
        const userId = payload && (payload.sub ?? payload.id ?? payload.userId);
        if (!userId) {
            return { statusCode: 401, body: { error: 'Unauthorized' } };
        }

        const { currentPassword, newPassword } = req.body ?? {};
        if (typeof currentPassword !== 'string' || !currentPassword
            || typeof newPassword !== 'string' || !newPassword) {
            return { statusCode: 400, body: { error: 'currentPassword and newPassword are required' } };
        }
        if (newPassword.length < deps.minPasswordLength) {
            return { statusCode: 400, body: { error: `password must be at least ${deps.minPasswordLength} characters` } };
        }

        const user = await deps.db.getById('users', String(userId)).catch(() => null);
        if (!user) {
            return { statusCode: 401, body: { error: 'Unauthorized' } };
        }

        const ok = await verifyPassword(user.passwordHash, currentPassword);
        if (!ok) {
            deps.logger.warn('Change-password failed — wrong currentPassword', { userId: user.id });
            return { statusCode: 401, body: { error: 'Current password is incorrect' } };
        }

        const passwordHash = await hashPassword(newPassword);
        await deps.db.update('users', String(user.id), { passwordHash });

        // Per Phase 2 default: revoke ALL refresh tokens — every device must re-login.
        const sessions = await deps.db.search('refreshTokens', { userId: String(user.id) });
        for (const s of sessions ?? []) {
            if (!s.revoked) {
                await deps.db.update('refreshTokens', String(s.id), { revoked: true });
            }
        }

        deps.logger.info('Password changed', { userId: user.id, sessionsRevoked: sessions?.length ?? 0 });
        return { statusCode: 200, body: { ok: true } };
    };
}
