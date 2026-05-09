import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextData {
    traceId: string;
    startTime: number;
}

const storage = new AsyncLocalStorage<RequestContextData>();

export const RequestContext = {
    /**
     * Wraps fn in an async context carrying data.
     * Called by the transport at the very start of each request.
     */
    run<T>(data: RequestContextData, fn: () => T): T {
        return storage.run(data, fn) as T;
    },

    /** Returns the full context for the current async scope, or undefined. */
    get(): RequestContextData | undefined {
        return storage.getStore();
    },

    /** Returns only the traceId, or undefined if called outside a request. */
    getTraceId(): string | undefined {
        return storage.getStore()?.traceId;
    },
};
