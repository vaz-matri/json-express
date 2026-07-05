import type {
    IMiddleware,
    JsonRequest,
    JsonResponse,
    IConfigProvider,
    ILogger,
    IKvStore,
    HookContext,
} from '@json-express/core';

interface MemoryEntry {
    count: number;
    resetAt: number;
}

/**
 * Global fixed-window rate limiter.
 *
 * Runs on EVERY route (`global = true`) so no endpoint — including login — can be reached
 * without passing the throttle. Counts requests per client per fixed time window; when the
 * count exceeds the limit the request is rejected with 429 before the route handler runs.
 *
 * State backend: uses the shared `IKvStore` (via `setHookContext`) when one is installed, so
 * limits are correct across multiple instances. With no KV store it falls back to an
 * in-process map and warns loudly — that only bounds a single instance, so production
 * deployments behind more than one replica should install `@json-express/kv-redis`.
 *
 * Config (all keys lowercase under `jex.ratelimit.*`):
 *   window      — window length in ms (default 60000)
 *   max         — max requests per client per window (default 100)
 *   trustproxy  — trust X-Forwarded-For for the client IP (default false; spoofable if the
 *                 app is not actually behind a trusted proxy, so opt in deliberately)
 *   exclude     — comma-separated path prefixes to skip (e.g. health checks)
 */
export class RateLimitMiddleware implements IMiddleware {
    public readonly name = 'ratelimit';
    public readonly global = true;
    public readonly provides = ['ratelimit'];

    private kv: IKvStore | undefined;
    private readonly windowMs: number;
    private readonly max: number;
    private readonly trustProxy: boolean;
    private readonly excludePaths: string[];
    private readonly logger: ILogger;
    private readonly memory = new Map<string, MemoryEntry>();

    constructor({ configProvider, logger }: { configProvider?: IConfigProvider; logger: ILogger }) {
        this.logger = logger.child({ component: 'RateLimit' });

        this.windowMs = toPositiveInt(configProvider?.get('ratelimit.window', 60000), 60000);
        this.max = toPositiveInt(configProvider?.get('ratelimit.max', 100), 100);

        const trust = configProvider?.get<unknown>('ratelimit.trustproxy', false);
        this.trustProxy = trust === true || trust === 'true';

        const rawExclude = configProvider?.get<string | string[]>('ratelimit.exclude', []);
        this.excludePaths = Array.isArray(rawExclude)
            ? rawExclude
            : typeof rawExclude === 'string'
                ? rawExclude.split(',').map(s => s.trim()).filter(Boolean)
                : [];
    }

    public setHookContext(ctx: HookContext): void {
        this.kv = ctx.kvStore;
        if (!this.kv) {
            this.logger.warn(
                'No KV store installed — rate limits are tracked in-process and only bound a ' +
                'single instance. Install @json-express/kv-redis for multi-instance correctness.'
            );
        }
    }

    public async handle(req: JsonRequest, next: () => Promise<JsonResponse>): Promise<JsonResponse> {
        if (this.excludePaths.some(p => req.path.startsWith(p))) {
            return next();
        }

        const now = Date.now();
        const windowStart = Math.floor(now / this.windowMs) * this.windowMs;
        const resetAt = windowStart + this.windowMs;
        const clientKey = this.clientIp(req);

        const count = await this.hit(clientKey, windowStart, resetAt);
        const remaining = Math.max(0, this.max - count);

        if (count > this.max) {
            this.logger.warn('Rate limit exceeded', { client: clientKey, path: req.path, count });
            return {
                statusCode: 429,
                headers: {
                    'Retry-After': String(Math.max(1, Math.ceil((resetAt - now) / 1000))),
                    'X-RateLimit-Limit': String(this.max),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
                },
                body: { error: 'Too many requests. Please retry later.' },
            };
        }

        const res = await next();
        res.headers = {
            ...res.headers,
            'X-RateLimit-Limit': String(this.max),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
        };
        return res;
    }

    /** Resolve the client identity, honoring trusted proxy headers only when opted in. */
    private clientIp(req: JsonRequest): string {
        if (this.trustProxy) {
            const xff = req.headers['x-forwarded-for'];
            const raw = Array.isArray(xff) ? xff[0] : xff;
            if (raw) return String(raw).split(',')[0].trim();
        }
        return req.ip ?? 'unknown';
    }

    /** Increment and return the request count for this client in the current window. */
    private async hit(clientKey: string, windowStart: number, resetAt: number): Promise<number> {
        if (this.kv) {
            // Window-keyed so a fresh key (and count) starts each window; the TTL keeps the
            // key aligned to the window end. get→set is not atomic, so under heavy concurrency
            // the count may slightly undershoot — acceptable and standard for rate limiting.
            const key = `rl:${clientKey}:${windowStart}`;
            const current = (await this.kv.get<number>(key)) ?? 0;
            const nextCount = current + 1;
            await this.kv.set(key, nextCount, { ttlMs: Math.max(1, resetAt - Date.now()) });
            return nextCount;
        }

        // In-process fallback: one self-resetting entry per client, so the map is bounded by
        // the number of distinct clients seen within a window rather than growing forever.
        const entry = this.memory.get(clientKey);
        if (!entry || entry.resetAt <= Date.now()) {
            this.memory.set(clientKey, { count: 1, resetAt });
            return 1;
        }
        entry.count += 1;
        return entry.count;
    }
}

function toPositiveInt(value: unknown, fallback: number): number {
    const n = typeof value === 'number' ? value : parseInt(String(value), 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default RateLimitMiddleware;
