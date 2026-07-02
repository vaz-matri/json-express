import type { IMiddleware, JsonRequest, JsonResponse, IConfigProvider, ILogger, JwtVerifier } from '@json-express/core';
import { createJwtVerifier } from '@json-express/core';

export class AuthMiddleware implements IMiddleware {
    public readonly name = 'auth';
    private verifier: JwtVerifier | null = null;
    private excludePaths: string[] = [];
    private logger: ILogger;

    constructor({ configProvider, logger }: { configProvider?: IConfigProvider; logger: ILogger }) {
        this.logger = logger.child({ component: 'Auth' });
        if (!configProvider) return;

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

        // 1. If no verifier is configured, bypass authentication entirely
        if (!this.verifier) {
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
