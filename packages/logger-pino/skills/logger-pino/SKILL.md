---
name: logger-pino
description: Production logging for a JSON Express app with pino: JSON lines, levels, file or stdout destinations, pretty dev output. Use when shipping logs or tuning verbosity.
---

# @json-express/logger-pino

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
Production log pipelines (JSON to stdout/file), or leveled logging in dev.

## How
1. `npm i @json-express/logger-pino`; `jex.logger=@json-express/logger-pino` if logger-console also installed.
2. `.env`: `jex.log.level=debug|info|warn|error`; `jex.log.path=stdout` (12-factor) or a directory/file for file mode; `jex.log.pretty=true` for human output.
3. Same automatic traceId correlation as the default logger.

## Verify
Log lines are valid JSON with level/time/traceId; file mode writes logs/app.log.
