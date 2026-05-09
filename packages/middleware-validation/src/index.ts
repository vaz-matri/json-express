import { z, ZodTypeAny } from 'zod';
import type {
    IMiddleware,
    JsonRequest,
    JsonResponse,
    ILogger,
    ModelSchema,
    Validator,
    ValidatorOrBuilder,
    CustomEndpointEntry,
} from '@json-express/core';

interface CompiledRule {
    method: string;
    pathPattern: RegExp;
    body?: Validator;
    query?: Validator;
}

/**
 * Treat anything with a `safeParse` method as a final Validator. Functions
 * without that method are treated as `ValidatorBuilder`.
 */
function isValidator(v: unknown): v is Validator {
    return !!v && typeof v === 'object' && typeof (v as any).safeParse === 'function';
}

/**
 * Convert an Express-style path with `:param` placeholders into a regex.
 * `/products` → `/^\/products\/?$/`
 * `/products/:id` → `/^\/products\/[^/]+\/?$/`
 */
function pathToRegex(path: string): RegExp {
    const escaped = path
        .replace(/[.+*?^${}()|[\]\\]/g, '\\$&')
        .replace(/\\:[A-Za-z_][A-Za-z0-9_]*/g, '[^/]+');
    return new RegExp(`^${escaped}/?$`);
}

/**
 * Derive a Zod baseline schema from a model's `fields`. Honors the simple
 * field options today: `required`, `minLength`/`maxLength`, `min`/`max`.
 * Fields with `id` and `relation` types are skipped — id is auto-generated,
 * and relations are resolved server-side, not posted by clients.
 */
function deriveBaseline(schema: ModelSchema): z.ZodObject<any> {
    const shape: Record<string, ZodTypeAny> = {};
    if (!schema.fields) return z.object({});

    for (const [name, defRaw] of Object.entries(schema.fields)) {
        const def = defRaw as any;
        const opts = def.options || {};
        let zod: ZodTypeAny;

        switch (def.type) {
            case 'string': {
                let s = z.string();
                if (typeof opts.minLength === 'number') s = s.min(opts.minLength);
                if (typeof opts.maxLength === 'number') s = s.max(opts.maxLength);
                zod = s;
                break;
            }
            case 'number': {
                let n = z.number();
                if (typeof opts.min === 'number') n = n.min(opts.min);
                if (typeof opts.max === 'number') n = n.max(opts.max);
                zod = n;
                break;
            }
            case 'boolean':
                zod = z.boolean();
                break;
            case 'date':
                // Accept ISO strings or Date instances; clients post strings most often.
                zod = z.union([z.string(), z.date()]);
                break;
            case 'id':
            case 'relation':
                continue;
            default:
                zod = z.any();
        }

        shape[name] = opts.required ? zod : zod.optional();
    }

    return z.object(shape);
}

/**
 * Resolve a `ValidatorOrBuilder` against a baseline. If the user supplied a
 * Validator (Zod schema), use it as-is. If they supplied a builder function,
 * call it with the baseline. If they supplied nothing, fall back to baseline.
 */
function resolveValidator(
    entry: ValidatorOrBuilder | undefined,
    baseline: Validator,
): Validator {
    if (entry === undefined) return baseline;
    if (isValidator(entry)) return entry;
    if (typeof entry === 'function') return entry(baseline);
    return baseline;
}

export class ValidationMiddleware implements IMiddleware {
    public readonly name = 'validation';
    private rules: CompiledRule[] = [];
    private logger: ILogger;

    constructor({ logger }: { logger: ILogger }) {
        this.logger = logger.child({ component: 'Validation' });
    }

    /**
     * Walk the model registry and compile a flat rule table the request handler
     * can match against. Called once at boot by the runner; subsequent reloads
     * would replace the rule set.
     */
    public setSchemas(schemas: ModelSchema[]): void {
        this.rules = [];
        for (const schema of schemas) {
            this.compileSchema(schema);
        }
        this.logger.info(`Compiled ${this.rules.length} validation rules from ${schemas.length} schemas`);
    }

    private compileSchema(schema: ModelSchema): void {
        const baseline = deriveBaseline(schema);
        const collectionPath = `/${schema.name}`;
        const itemPath = `/${schema.name}/:id`;

        const v = schema.validation;
        if (v) {
            // POST /{collection}  — create
            if (v.create) {
                const validator = resolveValidator(v.create.body, baseline);
                this.rules.push({
                    method: 'POST',
                    pathPattern: pathToRegex(collectionPath),
                    body: validator,
                });
            }

            // PATCH /{collection}/:id  — update (default to .partial() of baseline so PATCH semantics match)
            if (v.update) {
                const updateBaseline = baseline.partial();
                const validator = resolveValidator(v.update.body, updateBaseline);
                this.rules.push({
                    method: 'PATCH',
                    pathPattern: pathToRegex(itemPath),
                    body: validator,
                });
            }

            // GET /{collection}  — list (query params)
            if (v.list) {
                const validator = resolveValidator(v.list.query, z.object({}).passthrough());
                this.rules.push({
                    method: 'GET',
                    pathPattern: pathToRegex(collectionPath),
                    query: validator,
                });
            }
        }

        // Custom endpoints: object form may carry per-endpoint validation.
        if (schema.endpoints) {
            for (const [routeKey, entry] of Object.entries(schema.endpoints) as [string, CustomEndpointEntry][]) {
                if (typeof entry === 'function') continue;
                const validation = entry.validation;
                if (!validation || (!validation.body && !validation.query)) continue;

                const parts = routeKey.split(' ');
                const method = (parts.length > 1 ? parts[0] : 'GET').toUpperCase();
                const pathStr = parts.length > 1 ? parts[1] : parts[0];
                const cleanPath = pathStr === '/' ? '' : (pathStr.startsWith('/') ? pathStr : `/${pathStr}`);
                const fullPath = `/${schema.name}${cleanPath}`;

                this.rules.push({
                    method,
                    pathPattern: pathToRegex(fullPath),
                    body: validation.body ? resolveValidator(validation.body, baseline) : undefined,
                    query: validation.query ? resolveValidator(validation.query, z.object({}).passthrough()) : undefined,
                });
            }
        }
    }

    private findRule(req: JsonRequest): CompiledRule | undefined {
        const reqMethod = req.method.toUpperCase();
        // Strip query string if present in req.path (some transports include it).
        const path = req.path.split('?')[0];
        return this.rules.find(r => r.method === reqMethod && r.pathPattern.test(path));
    }

    public async handle(req: JsonRequest, next: () => Promise<JsonResponse>): Promise<JsonResponse> {
        if (this.rules.length === 0) return next();

        const rule = this.findRule(req);
        if (!rule) return next();

        const errors: any = {};

        if (rule.body && req.body && Object.keys(req.body).length > 0) {
            const result = rule.body.safeParse(req.body);
            if (!result.success) {
                errors.body = (result as any).error?.format ? (result as any).error.format() : (result as any).error;
            } else {
                req.body = (result as any).data;
            }
        }

        if (rule.query && req.query) {
            const result = rule.query.safeParse(req.query);
            if (!result.success) {
                errors.query = (result as any).error?.format ? (result as any).error.format() : (result as any).error;
            } else {
                req.query = (result as any).data;
            }
        }

        if (Object.keys(errors).length > 0) {
            this.logger.warn('Validation failed', { fields: Object.keys(errors), path: req.path });
            return {
                statusCode: 400,
                body: {
                    error: 'Validation failed',
                    details: errors,
                },
            };
        }

        return next();
    }
}
