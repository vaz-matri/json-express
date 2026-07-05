import Redis from 'ioredis';
import type { IKvStore, KvSetOptions, IConfigProvider, ILogger } from '@json-express/core';

export interface KvRedisConfig {
    /** Direct override; when omitted, read from jex.kv-redis.connectionstring */
    connectionString?: string;
    logger: ILogger;
    configProvider?: IConfigProvider;
}

/**
 * Redis-backed ephemeral key-value store adapter for JSONExpress.
 * @agent-instruction Inject this adapter into the kernel. Use `kernel.kv` to access it. It handles rate limit counters, OTPs, and temporary tokens.
 */
export class KvRedis implements IKvStore {
    private client: Redis;
    private logger: ILogger;

    constructor(config: KvRedisConfig) {
        const connectionString = config.connectionString
            ?? config.configProvider?.get<string>('kv-redis.connectionstring');
        if (!connectionString) {
            // Fail loud: letting ioredis default to localhost:6379 silently sends
            // production traffic to the wrong Redis.
            throw new Error(
                '@json-express/kv-redis: no connection string configured. ' +
                'Set jex.kv-redis.connectionstring in .env (or pass { connectionString } directly).'
            );
        }
        this.client = new Redis(connectionString);
        this.logger = config.logger.child({ component: 'KV-Redis' });

        this.client.on('error', (err) => {
            this.logger.error('Redis KV connection error', { error: err.message });
        });

        this.client.on('ready', () => {
            this.logger.info('Connected to Redis KV Store');
        });
    }

    public async get<T = any>(key: string): Promise<T | null> {
        try {
            const result = await this.client.get(key);
            if (!result) return null;
            return JSON.parse(result) as T;
        } catch (error: any) {
            this.logger.error(`Failed to get key [${key}]`, { error: error.message });
            return null;
        }
    }

    public async set(key: string, value: any, options?: KvSetOptions): Promise<void> {
        try {
            const stringified = JSON.stringify(value);
            if (options?.ttlMs) {
                await this.client.set(key, stringified, 'PX', options.ttlMs);
            } else {
                await this.client.set(key, stringified);
            }
            this.logger.debug(`Set key [${key}]`, { ttlMs: options?.ttlMs });
        } catch (error: any) {
            // Rethrow: callers (e.g. identity token issuance) must not believe a
            // failed write succeeded.
            this.logger.error(`Failed to set key [${key}]`, { error: error.message });
            throw error;
        }
    }

    public async delete(key: string): Promise<void> {
        try {
            await this.client.del(key);
            this.logger.debug(`Deleted key [${key}]`);
        } catch (error: any) {
            this.logger.error(`Failed to delete key [${key}]`, { error: error.message });
            throw error;
        }
    }

    public async isHealthy(): Promise<boolean> {
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        } catch {
            return false;
        }
    }

    /**
     * Gracefully shutdown connection
     */
    public async shutdown(): Promise<void> {
        this.logger.info('Shutting down KvRedis adapter...');
        this.client.disconnect();
    }
}

export default KvRedis;
