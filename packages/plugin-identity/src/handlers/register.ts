import type { IDatabaseAdapter, ILogger, JsonRequest, JsonResponse } from '@json-express/core';
import { signAccessToken, type JwtIssuerConfig } from '../jwt-issuer';
import { generateRefreshToken, hashPassword, hashRefreshToken } from '../crypto';

interface RegisterDeps {
    db: IDatabaseAdapter;
    issuer: JwtIssuerConfig;
    refreshTtlMs: number;
    allowRegistration: boolean;
    defaultRole: string;
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
        if (password.length < 8) {
            return { statusCode: 400, body: { error: 'password must be at least 8 characters' } };
        }

        const existing = await deps.db.search('users', { email });
        if (existing && existing.length > 0) {
            // Same shape as a 400 to avoid enumeration via differing status codes,
            // but we still need to tell the user something useful — generic message.
            return { statusCode: 409, body: { error: 'Account already exists' } };
        }

        const passwordHash = await hashPassword(password);
        const user = await deps.db.create('users', {
            email,
            passwordHash,
            role: deps.defaultRole,
            createdAt: new Date().toISOString(),
        });

        const accessToken = signAccessToken(
            { sub: String(user.id), role: user.role ?? deps.defaultRole, email: user.email },
            deps.issuer
        );

        const refreshToken = generateRefreshToken();
        const expiresAt = new Date(Date.now() + deps.refreshTtlMs).toISOString();
        await deps.db.create('refreshTokens', {
            userId: String(user.id),
            tokenHash: hashRefreshToken(refreshToken),
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
                user: { id: user.id, email: user.email, role: user.role ?? deps.defaultRole },
            },
        };
    };
}
