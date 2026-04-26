import type { IDatabaseAdapter, IEmailProvider, ILogger, JsonRequest, JsonResponse } from '@json-express/core';
import { signAccessToken, type JwtIssuerConfig } from '../jwt-issuer';
import { generateRandomToken, hashPassword, hashRandomToken } from '../crypto';
import { verificationEmail } from '../email-templates';

interface RegisterDeps {
    db: IDatabaseAdapter;
    issuer: JwtIssuerConfig;
    refreshTtlMs: number;
    allowRegistration: boolean;
    defaultRole: string;
    minPasswordLength: number;
    requireVerifiedEmail: boolean;
    emailProvider: IEmailProvider | null;
    appName: string;
    verifyUrl: string | null;
    fromAddress?: string;
    verifyTtlMs: number;
    logger: ILogger;
}

export function makeRegisterHandler(deps: RegisterDeps) {
    return async (req: JsonRequest): Promise<JsonResponse> => {
        if (!deps.allowRegistration) {
            return { statusCode: 403, body: { error: 'Registration is disabled' } };
        }

        const { email, password } = req.body ?? {};
        if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
            return { statusCode: 400, body: { error: 'email and password are required' } };
        }
        if (password.length < deps.minPasswordLength) {
            return { statusCode: 400, body: { error: `password must be at least ${deps.minPasswordLength} characters` } };
        }

        const existing = await deps.db.search('users', { email });
        if (existing && existing.length > 0) {
            return { statusCode: 409, body: { error: 'Account already exists' } };
        }

        const passwordHash = await hashPassword(password);
        const user = await deps.db.create('users', {
            email,
            passwordHash,
            role: deps.defaultRole,
            emailVerified: false,
            createdAt: new Date().toISOString(),
        });

        // Fire-and-forget the verification email (best-effort).
        if (deps.emailProvider && deps.verifyUrl) {
            const token = generateRandomToken();
            await deps.db.create('emailVerificationTokens', {
                userId: String(user.id),
                tokenHash: hashRandomToken(token),
                expiresAt: new Date(Date.now() + deps.verifyTtlMs).toISOString(),
                createdAt: new Date().toISOString(),
            });
            try {
                await deps.emailProvider.send(verificationEmail({
                    appName: deps.appName,
                    to: user.email,
                    from: deps.fromAddress,
                    actionUrl: deps.verifyUrl,
                    token,
                }));
            } catch (e: any) {
                deps.logger.error('Failed to send verification email', { userId: user.id, error: e?.message });
            }
        }

        // Strict mode: don't issue tokens. The user must verify first via the email link.
        if (deps.requireVerifiedEmail) {
            deps.logger.info('User registered (strict — awaiting verification)', { userId: user.id });
            return {
                statusCode: 201,
                body: {
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role ?? deps.defaultRole,
                        emailVerified: false,
                    },
                    message: 'Verification email sent. Please verify before logging in.',
                },
            };
        }

        const accessToken = signAccessToken(
            {
                sub: String(user.id),
                role: user.role ?? deps.defaultRole,
                email: user.email,
                emailVerified: false,
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

        deps.logger.info('User registered', { userId: user.id });
        return {
            statusCode: 201,
            body: {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role ?? deps.defaultRole,
                    emailVerified: false,
                },
            },
        };
    };
}
