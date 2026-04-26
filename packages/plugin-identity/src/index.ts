import { randomBytes } from 'crypto';
import type {
    IPlugin,
    IConfigProvider,
    ILogger,
    IDatabaseAdapter,
    ITransport,
    ModelSchema,
} from '@json-express/core';
import { ConsoleLogger, type JsonExpressKernel } from '@json-express/core';
import { identitySchemas } from './schemas';
import { hashPassword } from './crypto';
import { type JwtIssuerConfig } from './jwt-issuer';
import { makeLoginHandler } from './handlers/login';
import { makeRegisterHandler } from './handlers/register';
import { makeRefreshHandler } from './handlers/refresh';
import { makeLogoutHandler } from './handlers/logout';

export { identitySchemas, userModel, roleModel, refreshTokenModel } from './schemas';
export { hashPassword, verifyPassword, generateRefreshToken, hashRefreshToken } from './crypto';
export { signAccessToken, type IssuedTokenPayload, type JwtIssuerConfig } from './jwt-issuer';

const DEFAULT_TOKEN_TTL = '1h';
const DEFAULT_REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const DEFAULT_ROLE = 'user';
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

        // 2. Resolve runtime deps.
        const db = kernel.container.resolve<IDatabaseAdapter>('database');
        const transport = kernel.container.resolve<ITransport>('transport');

        const secret = configProvider.get<string | undefined>('auth.secret', undefined);
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
        const issuer = configProvider.get<string | undefined>('auth.issuer', undefined);
        const audience = configProvider.get<string | string[] | undefined>('auth.audience', undefined);
        const allowRegistration = configProvider.get<boolean>('auth.allowRegistration', true);
        const defaultRole = configProvider.get<string>('auth.defaultRole', DEFAULT_ROLE);

        const issuerConfig: JwtIssuerConfig = { secret, ttl, issuer, audience };

        // 3. Auto-seed the admin user on first boot (idempotent).
        await this.seedAdminIfEmpty(db);

        // 4. Mount auth routes directly via the transport. These are intentionally
        //    public — gating /login behind the auth middleware would be a chicken-
        //    and-egg problem. Routes registered here bypass the kernel's middleware
        //    composition step, which is the desired behavior.
        transport.registerRoute({
            method: 'POST',
            path: '/auth/login',
            handler: makeLoginHandler({ db, issuer: issuerConfig, refreshTtlMs, logger: this.logger }),
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

        this.logger.info('Identity routes mounted', {
            routes: ['POST /auth/login', 'POST /auth/register', 'POST /auth/refresh', 'POST /auth/logout'],
        });
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
            createdAt: new Date().toISOString(),
        });
        this.adminPassword = password;
    }
}
