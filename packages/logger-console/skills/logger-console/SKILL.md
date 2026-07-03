---
name: logger-console
description: Understand and use JSON Express default logging: structured lines with per-request traceId correlation. Use when debugging a request end-to-end or diagnosing lost context.
---

# @json-express/logger-console

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
Default logger (in boot). Debugging = grep one traceId across components.

## How
1. The logs of every request (transport → middleware → api → db) share one `traceId`.
2. Diagnostic: `JEX_DEBUG_CONTEXT=1` flags log lines that lost their request context.

## Verify
Make a request; grep its traceId — you see the full path through the framework.
