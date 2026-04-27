import type { IDatabaseAdapter, ILogger, JsonRequest, JsonResponse } from '@json-express/core';
import { signAccessToken, type JwtIssuerConfig } from '../jwt-issuer';
import { generateRandomToken, hashRandomToken, verifyPassword } from '../crypto';

interface LoginDeps {
    db: IDatabaseAdapter;
    issuer: JwtIssuerConfig;
    refreshTtlMs: number;
    requireVerifiedEmail: boolean;
    logger: ILogger;
}

const GENERIC_AUTH_ERROR = { statusCode: 401, body: { error: 'Invalid credentials' } } as const;

export function makeLoginHandler(deps: LoginDeps) {
    return async (req: JsonRequest): Promise<JsonResponse> => {
        const { email, password } = req.body ?? {};
        if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
            return { statusCode: 400, body: { error: 'email and password are required' } };
        }

        const matches = await deps.db.search('users', { email });
        const user = matches?.[0];
        if (!user) {
            // Hash a dummy value to keep the timing constant whether or not the user exists.
            await verifyPassword(
                '$argon2id$v=19$m=65536,t=3,p=1$YWFhYWFhYWFhYWFhYWFhYQ$vJfXr+iyM2yY2tZNcHJqAYxF4ku5XEIZ0AYNIGqzHqU',
                password
            );
            deps.logger.warn('Login failed — unknown email', { email });
            return GENERIC_AUTH_ERROR;
        }

        const ok = await verifyPassword(user.passwordHash, password);
        if (!ok) {
            deps.logger.warn('Login failed — bad password', { userId: user.id });
            return GENERIC_AUTH_ERROR;
        }

        if (deps.requireVerifiedEmail && !user.emailVerified) {
            deps.logger.warn('Login blocked — email not verified', { userId: user.id });
            return { statusCode: 403, body: { error: 'Email not verified' } };
        }

        if (user.requirePasswordReset) {
            deps.logger.warn('Login blocked — password reset required', { userId: user.id });
            return { statusCode: 403, body: { error: 'PASSWORD_RESET_REQUIRED' } };
        }

        const accessToken = signAccessToken(
            {
                sub: String(user.id),
                role: user.role ?? 'user',
                email: user.email,
                emailVerified: !!user.emailVerified,
            },
            deps.issuer
        );

        const refreshToken = generateRandomToken();
        const expiresAt = new Date(Date.now() + deps.refreshTtlMs).toISOString();
        await deps.db.create('refreshTokens', {
            userId: String(user.id),
            tokenHash: hashRandomToken(refreshToken),
            expiresAt,
            revoked: false,
            createdAt: new Date().toISOString(),
        });

        deps.logger.info('Login success', { userId: user.id });
        return {
            statusCode: 200,
            body: {
                accessToken,
                refreshToken,
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
