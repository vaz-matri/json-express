import type { ZodSchema } from 'zod';
import type { IMiddleware, JsonRequest, JsonResponse, IConfigProvider, ILogger } from '@json-express/core';

export interface ValidationRule {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | '*';
    path: string | RegExp;
    body?: ZodSchema<any>;
    query?: ZodSchema<any>;
}

export class ValidationMiddleware implements IMiddleware {
    public readonly name = 'validation';
    private rules: ValidationRule[] = [];
    private logger: ILogger;

    constructor({ configProvider, logger }: { configProvider?: IConfigProvider; logger: ILogger }) {
        this.logger = logger.child({ component: 'Validation' });
        if (!configProvider) return;
        
        const configRules = configProvider.get<ValidationRule[]>('validation.rules', []);
        
        if (Array.isArray(configRules)) {
            this.rules = configRules;
        }
    }

    private matchPath(requestPath: string, rulePath: string | RegExp): boolean {
        if (rulePath instanceof RegExp) {
            return rulePath.test(requestPath);
        }
        return requestPath === rulePath || requestPath.startsWith(rulePath);
    }

    private matchMethod(requestMethod: string, ruleMethod: string): boolean {
        return ruleMethod === '*' || requestMethod.toUpperCase() === ruleMethod.toUpperCase();
    }

    public async handle(req: JsonRequest, next: () => Promise<JsonResponse>): Promise<JsonResponse> {
        if (this.rules.length === 0) {
            return next();
        }

        // Find applicable rule(s)
        const matchedRule = this.rules.find(r => 
            this.matchMethod(req.method, r.method) && 
            this.matchPath(req.path, r.path)
        );

        if (!matchedRule) {
            return next();
        }

        const errors: any = {};

        // Body Validation
        if (matchedRule.body && req.body && Object.keys(req.body).length > 0) {
            const bodyResult = matchedRule.body.safeParse(req.body);
            if (!bodyResult.success) {
                errors.body = bodyResult.error.format();
            } else {
                // Mutate the original request to preserve stripped/transformed values
                req.body = bodyResult.data;
            }
        }

        // Query Validation
        if (matchedRule.query && req.query) {
            const queryResult = matchedRule.query.safeParse(req.query);
            if (!queryResult.success) {
                errors.query = queryResult.error.format();
            } else {
                req.query = queryResult.data;
            }
        }

        // If validation failed, reject immediately
        if (Object.keys(errors).length > 0) {
            this.logger.warn('Validation failed', { fields: Object.keys(errors) });
            return {
                statusCode: 400,
                body: {
                    error: 'Validation failed',
                    details: errors
                }
            };
        }

        if (matchedRule) {
            this.logger.debug('Validation passed');
        }

        return next();
    }
}
