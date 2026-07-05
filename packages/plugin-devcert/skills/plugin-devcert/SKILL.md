---
name: plugin-devcert
description: Serve a JSON Express app over locally-trusted HTTPS in development. Use when testing secure cookies, OAuth redirects, or anything requiring https://localhost.
---

# @json-express/plugin-devcert

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
Dev-only HTTPS. No-ops automatically in production.

## How
1. `npm i @json-express/plugin-devcert` — installing opts you in; `jex.https=false` to disable without uninstalling.
2. First run may prompt for sudo/keychain (trust installation).
3. Works with both transports (injects express.ssl and transport.fastify.ssl.*).

## Verify
`https://localhost:3000` serves with a browser-trusted certificate.
