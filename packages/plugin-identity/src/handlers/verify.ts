import type { IDatabaseAdapter, ILogger, JsonRequest, JsonResponse } from '@json-express/core';
import { hashRandomToken } from '../crypto';

interface VerifyDeps {
    db: IDatabaseAdapter;
    logger: ILogger;
}

const GENERIC_ERROR = { statusCode: 400, body: { error: 'Invalid or expired verification token' } } as const;

export function makeVerifyHandler(deps: VerifyDeps) {
    return async (req: JsonRequest): Promise<JsonResponse> => {
        const token = (req.body?.token ?? req.query?.token) as string | undefined;
        if (typeof token !== 'string' || !token) {
            return { statusCode: 400, body: { error: 'token is required' } };
        }

        const tokenHash = hashRandomToken(token);
        const matches = await deps.db.search('emailVerificationTokens', { tokenHash });
        const record = matches?.[0];
        if (!record || new Date(record.expiresAt).getTime() < Date.now()) {
            deps.logger.warn('Verify failed — token unknown or expired');
            return GENERIC_ERROR;
        }

        const user = await deps.db.getById('users', record.userId).catch(() => null);
        if (!user) {
            deps.logger.warn('Verify failed — user no longer exists', { userId: record.userId });
            return GENERIC_ERROR;
        }

        await deps.db.update('users', String(user.id), { emailVerified: true });
        await deps.db.delete('emailVerificationTokens', String(record.id));

        deps.logger.info('Email verified', { userId: user.id });
        return {
            statusCode: 200,
            body: { ok: true, user: { id: user.id, email: user.email, emailVerified: true } },
        };
    };
}
