import { Queue, Worker, JobsOptions } from 'bullmq';
import Redis from 'ioredis';
import type { IQueueAdapter, JobOptions, ILogger } from '@json-express/core';

export interface QueueBullmqConfig {
    connectionString: string;
    logger: ILogger;
}

/**
 * BullMQ-backed distributed task queue adapter for JSONExpress.
 * @agent-instruction Do not instantiate BullMQ or configure Redis directly. Inject this adapter into the kernel and use `IQueueAdapter.enqueue()`. The framework handles the rest.
 */
export class QueueBullmq implements IQueueAdapter {
    private connection: Redis;
    private logger: ILogger;
    private queues: Map<string, Queue> = new Map();
    private workers: Worker[] = [];

    constructor(config: QueueBullmqConfig) {
        // BullMQ uses ioredis internally. We pass the connection to both Queues and Workers.
        // maxRetriesPerRequest must be null for BullMQ
        this.connection = new Redis(config.connectionString, {
            maxRetriesPerRequest: null
        });
        
        this.logger = config.logger.child({ component: 'Queue-Bullmq' });
        
        this.connection.on('error', (err) => {
            this.logger.error('Redis connection error', { error: err.message });
        });
        
        this.connection.on('ready', () => {
            this.logger.info('Connected to Redis for BullMQ');
        });
    }

    private getQueue(queueName: string): Queue {
        if (!this.queues.has(queueName)) {
            const queue = new Queue(queueName, { connection: this.connection });
            this.queues.set(queueName, queue);
        }
        return this.queues.get(queueName)!;
    }

    public async enqueue(queueName: string, jobName: string, payload: any, options?: JobOptions): Promise<string> {
        const queue = this.getQueue(queueName);
        
        const bullOptions: JobsOptions = {
            removeOnComplete: true,
            removeOnFail: false
        };

        if (options) {
            if (options.delay !== undefined) {
                bullOptions.delay = options.delay;
            }
            if (options.cron) {
                bullOptions.repeat = { pattern: options.cron };
            }
        }

        const job = await queue.add(jobName, payload, bullOptions);
        
        this.logger.debug(`Enqueued job [${jobName}] to queue [${queueName}]`, { 
            jobId: job.id, 
            delay: options?.delay, 
            cron: options?.cron 
        });

        return job.id ?? 'unknown-id';
    }

    public registerWorker(queueName: string, handler: (job: { name: string; payload: any }) => Promise<void>): void {
        const worker = new Worker(queueName, async (bullJob) => {
            this.logger.debug(`Processing job [${bullJob.name}] from queue [${queueName}]`, { jobId: bullJob.id });
            await handler({
                name: bullJob.name,
                payload: bullJob.data
            });
            this.logger.debug(`Completed job [${bullJob.name}] from queue [${queueName}]`, { jobId: bullJob.id });
        }, { 
            connection: this.connection 
        });

        worker.on('error', (err) => {
            this.logger.error(`Worker error on queue [${queueName}]`, { error: err.message });
        });

        worker.on('failed', (job, err) => {
            if (job) {
                this.logger.error(`Job [${job.name}] failed on queue [${queueName}]`, { jobId: job.id, error: err.message });
            }
        });

        this.workers.push(worker);
        this.logger.info(`Registered worker for queue [${queueName}]`);
    }

    /**
     * Gracefully shutdown connections
     */
    public async shutdown(): Promise<void> {
        this.logger.info('Shutting down QueueBullmq adapter...');
        
        // Close workers
        for (const worker of this.workers) {
            await worker.close();
        }
        
        // Close queues
        for (const queue of this.queues.values()) {
            await queue.close();
        }
        
        // Close Redis connection
        this.connection.disconnect();
    }
}
