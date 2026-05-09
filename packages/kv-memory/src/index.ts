import type { IKvStore, KvSetOptions, IConfigProvider, ILogger } from '@json-express/core';

interface Entry {
    value: any;
    expiresAt?: number;
}

const DEFAULT_PURGE_INTERVAL_MS = 30_000;

export class MemoryKvStore implements IKvStore {
    private store: Map<string, Entry> = new Map();
    private logger: ILogger;
    private purgeTimer?: NodeJS.Timeout;

    constructor({ configProvider, logger }: { configProvider?: IConfigProvider; logger: ILogger }) {
        this.logger = logger.child({ component: 'KV-Memory' });

        const purgeIntervalMs = configProvider?.get<number>('kv.purgeIntervalMs', DEFAULT_PURGE_INTERVAL_MS)
            ?? DEFAULT_PURGE_INTERVAL_MS;

        if (purgeIntervalMs > 0) {
            this.purgeTimer = setInterval(() => this.purgeExpired(), purgeIntervalMs);
            // Don't keep the Node event loop alive solely for this timer.
            this.purgeTimer.unref?.();
        }
    }

    public async get<T = any>(key: string): Promise<T | null> {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (entry.expiresAt !== undefined && entry.expiresAt <= Date.now()) {
            this.store.delete(key);
            return null;
        }
        return entry.value as T;
    }

    public async set(key: string, value: any, options?: KvSetOptions): Promise<void> {
        const expiresAt = options?.ttlMs !== undefined ? Date.now() + options.ttlMs : undefined;
        this.store.set(key, { value, expiresAt });
    }

    public async delete(key: string): Promise<void> {
        this.store.delete(key);
    }

    public async isHealthy(): Promise<boolean> {
        return true;
    }

    private purgeExpired(): void {
        const now = Date.now();
        for (const [key, entry] of this.store) {
            if (entry.expiresAt !== undefined && entry.expiresAt <= now) {
                this.store.delete(key);
            }
        }
    }
}
