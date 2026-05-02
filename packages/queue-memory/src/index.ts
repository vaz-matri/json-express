import type { IQueueAdapter, JobOptions, IConfigProvider, ILogger } from '@json-express/core';
import { randomUUID } from 'crypto';

type Handler = (job: { name: string, payload: any }) => Promise<void>;

export class MemoryQueueAdapter implements IQueueAdapter {
    private handlers: Map<string, Handler> = new Map();
    private logger: ILogger;

    constructor({ configProvider, logger }: { configProvider?: IConfigProvider; logger: ILogger }) {
        this.logger = logger.child({ component: 'Queue-Memory' });
    }

    public async enqueue(queueName: string, jobName: string, payload: any, options?: JobOptions): Promise<string> {
        const jobId = randomUUID();
        const delay = options?.delay ?? 0;

        if (options?.cron) {
            this.logger.warn(
                `MemoryQueueAdapter: cron schedules are not supported in the in-memory adapter — job '${jobName}' on '${queueName}' will run once.`,
                { jobId, queueName, jobName, cron: options.cron }
            );
        }

        const dispatch = () => {
            const handler = this.handlers.get(queueName);
            if (!handler) {
                this.logger.warn(
                    `MemoryQueueAdapter: no worker registered for queue '${queueName}' — dropping job '${jobName}'.`,
                    { jobId, queueName, jobName }
                );
                return;
            }
            // Fire-and-forget; surface failures via the logger so jobs don't crash the server.
            Promise.resolve(handler({ name: jobName, payload })).catch((err) => {
                this.logger.error(
                    `MemoryQueueAdapter: job '${jobName}' on queue '${queueName}' failed`,
                    { jobId, queueName, jobName, error: err?.message ?? String(err) }
                );
            });
        };

        const timer = setTimeout(dispatch, delay);
        timer.unref?.();

        return jobId;
    }

    public registerWorker(queueName: string, handler: Handler): void {
        if (this.handlers.has(queueName)) {
            this.logger.warn(
                `MemoryQueueAdapter: replacing existing worker for queue '${queueName}'.`,
                { queueName }
            );
        }
        this.handlers.set(queueName, handler);
    }
}
