import type { IMiddleware, JsonRequest, JsonResponse, IConfigProvider, ILogger, JwtVerifier } from '@json-express/core';
import { createJwtVerifier, FatalBootError } from '@json-express/core';

export class AuthMiddleware implements IMiddleware {
    public readonly name = 'auth';
    private verifier: JwtVerifier | null = null;
    private excludePaths: string[] = [];
    private required = false;
    private logger: ILogger;

    constructor({ configProvider, logger }: { configProvider?: IConfigProvider; logger: ILogger }) {
        this.logger = logger.child({ component: 'Auth' });
        if (!configProvider) return;

        // Production fails closed: default auth.required=true in production so an app can't
        // silently ship an open API. This is a fail-closed DEFAULT (safe to tighten) — never
        // a fabricated secret — so a real user value always wins, and a public production API
        // opts out explicitly with jex.auth.required=false. Registered before the read below.
        const isProduction = configProvider.get<string>('mode', 'development') === 'production';
        configProvider.registerDefaults?.('auth', { required: isProduction });

        // Strict mode: refuse to serve unauthenticated traffic when auth is
        // expected but not (or mis-)configured — instead of the dev-friendly bypass.
        this.required = configProvider.get<boolean>('auth.required', false) === true;

        const secret = configProvider.get<string | undefined>('auth.secret', undefined);
        const jwksUri = configProvider.get<string | undefined>('auth.jwksUri', undefined);
        const audience = configProvider.get<string | string[] | undefined>('auth.audience', undefined);
        const issuer = configProvider.get<string | undefined>('auth.issuer', undefined);
        const algorithms = configProvider.get<string[] | undefined>('auth.algorithms', undefined);

        const hasSecret = typeof secret === 'string' && secret.length > 0;
        const hasJwks = typeof jwksUri === 'string' && jwksUri.length > 0;

        if (hasSecret || hasJwks) {
            this.verifier = createJwtVerifier({ secret, jwksUri, audience, issuer, algorithms });
        }

        // Boot-time fail-closed: auth is required but there is no way to verify a token.
        // Veto boot with the exact remedy rather than starting a server that would 503 every
        // request (or, worse in production, quietly accept none). Fail loud, at boot — the
        // runner logs this and shuts down cleanly. Name the concrete env vars an operator
        // must set (both the .env dotted form and the uppercase JEX__ form for PaaS).
        if (this.required && !this.verifier) {
            const requiredNote = isProduction
                ? 'auth.required defaults to true in production, so this check is strict by default.'
                : 'auth.required is set to true.';
            throw new FatalBootError(
                'Authentication is required but no token verifier is configured. ' +
                `${requiredNote} Set a signing secret (HS256) or a JWKS URI (asymmetric) — neither is present.`,
                [
                    'Fix by setting ONE of the following (in .env, or the environment), then restart:',
                    '     jex.auth.secret=<your-hs256-signing-secret>       # symmetric HS256',
                    '     jex.auth.jwksuri=https://issuer/.well-known/jwks.json   # asymmetric JWKS',
                    '   PaaS uppercase equivalents: JEX__AUTH__SECRET / JEX__AUTH__JWKSURI',
                    '   Or, to intentionally run a PUBLIC API with no authentication, set:',
                    '     jex.auth.required=false   (JEX__AUTH__REQUIRED=false)',
                ].join('\n'),
            );
        }

        // Extract and format exclude paths (handles either array or comma-separated string)
        const rawExclude = configProvider.get<string | string[]>('auth.exclude', []);

        if (Array.isArray(rawExclude)) {
            this.excludePaths = rawExclude;
        } else if (typeof rawExclude === 'string') {
            this.excludePaths = rawExclude.split(',').map(s => s.trim()).filter(Boolean);
        }
    }

    public async handle(req: JsonRequest, next: () => Promise<JsonResponse>): Promise<JsonResponse> {
        // SECURITY: Always strip client-provided internal headers to prevent spoofing!
        // If an attacker sends this header manually, we must discard it before anything else.
        delete req.headers['x-user-payload'];
        delete req.headers['X-User-Payload'];

        // 1. No verifier configured: bypass in dev ergonomics mode, hard-fail in
        //    strict mode (jex.auth.required=true) — agents/operators can't miss a 503.
        if (!this.verifier) {
            if (this.required) {
                this.logger.error('auth.required=true but no verifier is configured (set jex.auth.secret or jex.auth.jwksUri). Refusing request.');
                return {
                    statusCode: 503,
                    body: { error: 'Authentication is required but not configured (jex.auth.secret / jex.auth.jwksUri missing).' }
                };
            }
            this.logger.warn('Auth not configured (neither auth.secret nor auth.jwksUri). Authentication bypassed.');
            return next();
        }

        // 2. Bypass if request path matches an exclusion pattern
        if (this.excludePaths.some(path => req.path.startsWith(path))) {
            return next();
        }

        // 3. Extract Bearer token (header presence check stays here so we can return 401 vs 403 distinctly)
        const authHeader = req.headers['authorization'];
        if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
            this.logger.warn('Rejected — missing or invalid Bearer token');
            return {
                statusCode: 401,
                body: { error: 'Unauthorized: Missing or invalid Bearer token.' }
            };
        }

        // 4. Verify token via the shared core primitive
        const userPayload = await this.verifier(authHeader);
        if (!userPayload) {
            this.logger.warn('Rejected — invalid or expired token');
            return {
                statusCode: 403,
                body: { error: 'Forbidden: Invalid or expired token.' }
            };
        }

        // Inject decoded user payload into headers so downstream plugins/generators can access it
        req.headers['x-user-payload'] = userPayload;

        this.logger.info('Access granted');
        return next();
    }
}

export default AuthMiddleware;
