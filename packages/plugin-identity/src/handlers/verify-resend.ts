import type { IDatabaseAdapter, IEmailProvider, IKvStore, ILogger, JsonRequest, JsonResponse } from '@json-express/core';
import { generateRandomToken, hashRandomToken } from '../crypto';
import { verificationEmail } from '../email-templates';

interface VerifyResendDeps {
    db: IDatabaseAdapter;
    kvStore: IKvStore;
    email: IEmailProvider;
    appName: string;
    verifyUrl: string;
    fromAddress?: string;
    verifyTtlMs: number;
    logger: ILogger;
}

export function makeVerifyResendHandler(deps: VerifyResendDeps) {
    return async (req: JsonRequest): Promise<JsonResponse> => {
        const { email } = req.body ?? {};
        if (typeof email !== 'string' || !email) {
            return { statusCode: 400, body: { error: 'email is required' } };
        }

        // Resolve the user, but ALWAYS return the same shape — anti-enumeration.
        const matches = await deps.db.search('users', { email });
        const user = matches?.[0];
        if (user && !user.emailVerified) {
            const token = generateRandomToken();
            await deps.kvStore.set(
                `ev:${hashRandomToken(token)}`,
                { userId: String(user.id) },
                { ttlMs: deps.verifyTtlMs }
            );
            try {
                await deps.email.send(verificationEmail({
                    appName: deps.appName,
                    to: user.email,
                    from: deps.fromAddress,
                    actionUrl: deps.verifyUrl,
                    token,
                }));
                deps.logger.info('Resent verification email', { userId: user.id });
            } catch (e: any) {
                deps.logger.error('Failed to send verification email', { userId: user.id, error: e?.message });
            }
        }

        return { statusCode: 200, body: { ok: true } };
    };
}
