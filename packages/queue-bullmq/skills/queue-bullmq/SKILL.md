---
name: queue-bullmq
description: Durable background jobs for a JSON Express app on BullMQ + Redis: delays, cron repeats, restart-surviving queues. The production queue.
---

# @json-express/queue-bullmq

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
Production job processing; scheduled/cron work.

## How
1. `npm i @json-express/queue-bullmq`; `jex.queue=@json-express/queue-bullmq` if queue-memory also installed.
2. `.env`: `jex.queue-bullmq.connectionString=redis://...` (required — boot fails loudly without it).
3. Same ctx.queue surface, plus `{ cron: '0 * * * *' }` for repeatable jobs.

## Verify
Enqueue, restart the server, job still processes (durability); cron jobs repeat.
