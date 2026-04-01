import jwt from 'jsonwebtoken';
import type { IMiddleware, JsonRequest, JsonResponse, IConfigProvider } from '@json-express/core';

export class AuthMiddleware implements IMiddleware {
    public readonly name = 'auth';
    private secret: string | null = null;
    private excludePaths: string[] = [];

    constructor({ configProvider }: { configProvider?: IConfigProvider }) {
        if (!configProvider) return;

        // Extract secret
        this.secret = configProvider.get<string>('auth.secret', null as any);

        // Extract and format exclude paths (handles either array or comma-separated string)
        const rawExclude = configProvider.get<string | string[]>('auth.exclude', []);
        
        if (Array.isArray(rawExclude)) {
            this.excludePaths = rawExclude;
        } else if (typeof rawExclude === 'string') {
            this.excludePaths = rawExclude.split(',').map(s => s.trim()).filter(Boolean);
        }
    }

    public async handle(req: JsonRequest, next: () => Promise<JsonResponse>): Promise<JsonResponse> {
        // 1. If no secret is configured, bypass authentication entirely
        if (!this.secret) {
            console.warn('⚠️ [AuthMiddleware] JEX__AUTH__SECRET is missing. Authentication bypassed completely.');
            return next();
        }

        // 2. Bypass if request path matches an exclusion pattern
        if (this.excludePaths.some(path => req.path.startsWith(path))) {
            return next();
        }

        // 3. Extract Bearer token
        const authHeader = req.headers['authorization'];
        if (!authHeader || Array.isArray(authHeader) || !authHeader.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                body: { error: 'Unauthorized: Missing or invalid Bearer token.' }
            };
        }

        const token = authHeader.split(' ')[1];

        // 4. Verify token
        try {
            const decoded = jwt.verify(token, this.secret);
            
            // Inject decoded user payload into headers so downstream plugins/generators can access it
            req.headers['x-user-payload'] = JSON.stringify(decoded);

            return next();
        } catch (error: any) {
            return {
                statusCode: 403,
                body: { error: 'Forbidden: Invalid or expired token.' }
            };
        }
    }
}
