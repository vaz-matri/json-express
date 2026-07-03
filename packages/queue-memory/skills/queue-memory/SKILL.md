---
name: queue-memory
description: Offload background work in a JSON Express app with an in-process queue — ctx.queue.enqueue for emails, webhooks, slow tasks in development.
---

# @json-express/queue-memory

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
Development background jobs (one-shot/delayed; no cron, not durable).

## How
1. `npm i @json-express/queue-memory` — no config.
2. In hooks/endpoints: `await ctx.queue.enqueue('emails', 'welcome', { userId }, { delay: 5000 })`.
3. Job failures are logged, never crash the server.

## Verify
Enqueue from an afterCreate hook — the response returns immediately; the job log line appears after the delay.
