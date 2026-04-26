import { randomBytes } from 'crypto';
import type {
    IPlugin,
    IConfigProvider,
    ILogger,
    IDatabaseAdapter,
    IEmailProvider,
    ITransport,
    ModelSchema,
} from '@json-express/core';
import { ConsoleLogger, createJwtVerifier, type JsonExpressKernel } from '@json-express/core';
import { identitySchemas } from './schemas';
import { hashPassword } from './crypto';
import { type JwtIssuerConfig } from './jwt-issuer';
import { makeLoginHandler } from './handlers/login';
import { makeRegisterHandler } from './handlers/register';
import { makeRefreshHandler } from './handlers/refresh';
import { makeLogoutHandler } from './handlers/logout';
import { makeVerifyHandler } from './handlers/verify';
import { makeVerifyResendHandler } from './handlers/verify-resend';
import { makeForgotPasswordHandler } from './handlers/forgot-password';
import { makeResetPasswordHandler } from './handlers/reset-password';
import { makeChangePasswordHandler } from './handlers/change-password';

export {
    identitySchemas,
    userModel,
    roleModel,
    refreshTokenModel,
    emailVerificationTokenModel,
    passwordResetTokenModel,
} from './schemas';
export {
    hashPassword,
    verifyPassword,
    generateRefreshToken,
    hashRefreshToken,
    generateRandomToken,
    hashRandomToken,
} from './crypto';
export { signAccessToken, type IssuedTokenPayload, type JwtIssuerConfig } from './jwt-issuer';
export { verificationEmail, passwordResetEmail, type EmailTemplateContext } from './email-templates';

const DEFAULT_TOKEN_TTL = '1h';
const DEFAULT_REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const DEFAULT_VERIFY_TTL_MS = 24 * 60 * 60 * 1000;       // 24 hours
const DEFAULT_RESET_TTL_MS = 30 * 60 * 1000;              // 30 minutes
const DEFAULT_ROLE = 'user';
const DEFAULT_APP_NAME = 'JSON Express';
const DEFAULT_VERIFY_URL = 'http://localhost:3000/auth/verify';
const DEFAULT_RESET_URL = 'http://localhost:3000/auth/password/reset';
const DEFAULT_MIN_PASSWORD_LENGTH = 8;
const ADMIN_EMAIL = 'admin@local';

function parseDurationMs(value: string | undefined, fallback: number): number {
    if (!value) return fallback;
    const m = /^(\d+)\s*(ms|s|m|h|d)$/.exec(value.trim());
    if (!m) {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    }
    const num = Number(m[1]);
    switch (m[2]) {
        case 'ms': return num;
        case 's': return num * 1000;
        case 'm': return num * 60 * 1000;
        case 'h': return num * 60 * 60 * 1000;
        case 'd': return num * 24 * 60 * 60 * 1000;
        default: return fallback;
    }
}

export class IdentityPlugin implements IPlugin {
    public readonly name = 'identity';
    private logger: ILogger;
    private adminPassword: string | null = null;

    constructor({ configProvider: _config, logger }: { configProvider?: IConfigProvider; logger?: ILogger } = {}) {
        this.logger = logger?.child({ component: 'Identity' })
            ?? new ConsoleLogger({ context: { component: 'Identity' } });
    }

    public provideSchemas(): ModelSchema[] {
        return identitySchemas;
    }

    public async onBoot(kernel: JsonExpressKernel, configProvider: IConfigProvider): Promise<void> {
        // 1. Peer-dep enforcement: token issuance is useless without a verifier.
        if (!kernel.container.hasRegistration('middleware:auth')) {
            throw new Error(
                "@json-express/plugin-identity requires @json-express/middleware-auth to verify the tokens it issues. " +
                "Install it: pnpm add @json-express/middleware-auth"
            );
        }

        const db = kernel.container.resolve<IDatabaseAdapter>('database');
        const transport = kernel.container.resolve<ITransport>('transport');

        // Email provider is optional — verification + password-reset endpoints only mount when present.
        const emailProvider: IEmailProvider | null = kernel.container.hasRegistration('emailProvider')
            ? kernel.container.resolve<IEmailProvider>('emailProvider')
            : null;

        const secret = configProvider.get<string | undefined>('auth.secret', undefined);
        const jwksUri = configProvider.get<string | undefined>('auth.jwksUri', undefined);
        const algorithms = configProvider.get<string[] | undefined>('auth.algorithms', undefined);
        if (!secret || typeof secret !== 'string') {
            throw new Error(
                '@json-express/plugin-identity requires JEX__AUTH__SECRET to be set so it can sign access tokens.'
            );
        }

        const ttl = configProvider.get<string>('auth.tokenTtl', DEFAULT_TOKEN_TTL);
        const refreshTtlMs = parseDurationMs(
            configProvider.get<string | undefined>('auth.refreshTtl', undefined),
            DEFAULT_REFRESH_TTL_MS
        );
        const verifyTtlMs = parseDurationMs(
            configProvider.get<string | undefined>('auth.verifyTtl', undefined),
            DEFAULT_VERIFY_TTL_MS
        );
        const resetTtlMs = parseDurationMs(
            configProvider.get<string | undefined>('auth.resetTtl', undefined),
            DEFAULT_RESET_TTL_MS
        );
        const issuer = configProvider.get<string | undefined>('auth.issuer', undefined);
        const audience = configProvider.get<string | string[] | undefined>('auth.audience', undefined);
        const allowRegistration = configProvider.get<boolean>('auth.allowRegistration', true);
        const defaultRole = configProvider.get<string>('auth.defaultRole', DEFAULT_ROLE);
        const requireVerifiedEmail = configProvider.get<boolean>('auth.requireVerifiedEmail', false);
        const minPasswordLength = configProvider.get<number>('auth.minPasswordLength', DEFAULT_MIN_PASSWORD_LENGTH);
        const appName = configProvider.get<string>('auth.email.appName', DEFAULT_APP_NAME);
        const verifyUrl = configProvider.get<string>('auth.email.verifyUrl', DEFAULT_VERIFY_URL);
        const resetUrl = configProvider.get<string>('auth.email.resetUrl', DEFAULT_RESET_URL);
        const fromAddress = configProvider.get<string | undefined>('auth.email.from', undefined);

        const issuerConfig: JwtIssuerConfig = { secret, ttl, issuer, audience };

        // Verifier for change-password — bypasses middleware composition the same
        // way the rest of /auth/* does. Mirrors the config middleware-auth uses,
        // so a JWKS-backed project still validates change-password tokens correctly.
        const verifier = createJwtVerifier({
            secret,
            jwksUri,
            audience,
            issuer,
            algorithms,
        });

        await this.seedAdminIfEmpty(db);

        // Mount auth routes directly via the transport. These are intentionally
        // public — gating /login behind the auth middleware would be a chicken-
        // and-egg problem. Routes registered here bypass the kernel's middleware
        // composition step, which is the desired behavior.
        transport.registerRoute({
            method: 'POST',
            path: '/auth/login',
            handler: makeLoginHandler({
                db,
                issuer: issuerConfig,
                refreshTtlMs,
                requireVerifiedEmail,
                logger: this.logger,
            }),
        });
        transport.registerRoute({
            method: 'POST',
            path: '/auth/register',
            handler: makeRegisterHandler({
                db,
                issuer: issuerConfig,
                refreshTtlMs,
                allowRegistration,
                defaultRole,
                minPasswordLength,
                requireVerifiedEmail,
                emailProvider,
                appName,
                verifyUrl: emailProvider ? verifyUrl : null,
                fromAddress,
                verifyTtlMs,
                logger: this.logger,
            }),
        });
        transport.registerRoute({
            method: 'POST',
            path: '/auth/refresh',
            handler: makeRefreshHandler({ db, issuer: issuerConfig, refreshTtlMs, logger: this.logger }),
        });
        transport.registerRoute({
            method: 'POST',
            path: '/auth/logout',
            handler: makeLogoutHandler({ db, logger: this.logger }),
        });

        const mounted: string[] = [
            'POST /auth/login',
            'POST /auth/register',
            'POST /auth/refresh',
            'POST /auth/logout',
        ];

        if (emailProvider) {
            transport.registerRoute({
                method: 'POST',
                path: '/auth/verify',
                handler: makeVerifyHandler({ db, logger: this.logger }),
            });
            transport.registerRoute({
                method: 'POST',
                path: '/auth/verify/resend',
                handler: makeVerifyResendHandler({
                    db,
                    email: emailProvider,
                    appName,
                    verifyUrl,
                    fromAddress,
                    verifyTtlMs,
                    logger: this.logger,
                }),
            });
            transport.registerRoute({
                method: 'POST',
                path: '/auth/password/forgot',
                handler: makeForgotPasswordHandler({
                    db,
                    email: emailProvider,
                    appName,
                    resetUrl,
                    fromAddress,
                    resetTtlMs,
                    logger: this.logger,
                }),
            });
            transport.registerRoute({
                method: 'POST',
                path: '/auth/password/reset',
                handler: makeResetPasswordHandler({ db, minPasswordLength, logger: this.logger }),
            });
            mounted.push(
                'POST /auth/verify',
                'POST /auth/verify/resend',
                'POST /auth/password/forgot',
                'POST /auth/password/reset',
            );
        } else {
            this.logger.info(
                'Email provider not registered — verification and password-reset endpoints disabled. ' +
                'Install @json-express/email-console (or another email-* plugin) to enable.'
            );
        }

        // change-password is always available — it doesn't depend on email.
        transport.registerRoute({
            method: 'POST',
            path: '/auth/password/change',
            handler: makeChangePasswordHandler({ db, verifier, minPasswordLength, logger: this.logger }),
        });
        mounted.push('POST /auth/password/change');

        this.logger.info('Identity routes mounted', { routes: mounted });
    }

    public async onReady(_kernel: JsonExpressKernel, _configProvider: IConfigProvider): Promise<void> {
        if (this.adminPassword) {
            const padded = this.adminPassword.padEnd(43);
            this.logger.warn(
                '\n' +
                '┌─────────────────────────────────────────────────────────┐\n' +
                '│  Admin account created                                  │\n' +
                `│    email:    ${ADMIN_EMAIL.padEnd(43)}│\n` +
                `│    password: ${padded}│\n` +
                '│  This password will not be shown again.                 │\n' +
                '└─────────────────────────────────────────────────────────┘'
            );
            this.adminPassword = null;
        }
    }

    private async seedAdminIfEmpty(db: IDatabaseAdapter): Promise<void> {
        const existing = await db.getAll('users');
        if (existing && existing.length > 0) return;

        const password = randomBytes(12).toString('base64url');
        const passwordHash = await hashPassword(password);
        await db.create('users', {
            email: ADMIN_EMAIL,
            passwordHash,
            role: 'admin',
            emailVerified: true,
            createdAt: new Date().toISOString(),
        });
        this.adminPassword = password;
    }
}
