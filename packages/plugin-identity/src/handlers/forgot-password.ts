import type { IDatabaseAdapter, IEmailProvider, ILogger, JsonRequest, JsonResponse } from '@json-express/core';
import { generateRandomToken, hashRandomToken } from '../crypto';
import { passwordResetEmail } from '../email-templates';

interface ForgotPasswordDeps {
    db: IDatabaseAdapter;
    email: IEmailProvider;
    appName: string;
    resetUrl: string;
    fromAddress?: string;
    resetTtlMs: number;
    logger: ILogger;
}

export function makeForgotPasswordHandler(deps: ForgotPasswordDeps) {
    return async (req: JsonRequest): Promise<JsonResponse> => {
        const { email } = req.body ?? {};
        if (typeof email !== 'string' || !email) {
            return { statusCode: 400, body: { error: 'email is required' } };
        }

        const matches = await deps.db.search('users', { email });
        const user = matches?.[0];
        if (user) {
            const token = generateRandomToken();
            await deps.db.create('passwordResetTokens', {
                userId: String(user.id),
                tokenHash: hashRandomToken(token),
                expiresAt: new Date(Date.now() + deps.resetTtlMs).toISOString(),
                createdAt: new Date().toISOString(),
            });
            try {
                await deps.email.send(passwordResetEmail({
                    appName: deps.appName,
                    to: user.email,
                    from: deps.fromAddress,
                    actionUrl: deps.resetUrl,
                    token,
                }));
                deps.logger.info('Sent password reset email', { userId: user.id });
            } catch (e: any) {
                deps.logger.error('Failed to send password reset email', { userId: user.id, error: e?.message });
            }
        }

        // Always 200 — anti-enumeration. The same response whether the email exists or not.
        return { statusCode: 200, body: { ok: true } };
    };
}
