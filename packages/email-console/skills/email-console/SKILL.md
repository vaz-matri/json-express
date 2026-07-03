---
name: email-console
description: Send development emails to the console from a JSON Express app — enables ctx.email in hooks and plugin-identity verification/reset flows without an SMTP server.
---

# @json-express/email-console

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
Development. Any flow that sends email (welcome, verification, reset) without real delivery.

## How
1. `npm i @json-express/email-console`; optional `jex.email.from=no-reply@myapp.dev`.
2. In model hooks: `await ctx.email?.send({ to, subject, text })` — the `?.` keeps the model working when no email package is installed.
3. Tokens/links appear in server output — grep-able for tests.

## Verify
Trigger the flow; the framed email block appears in the server console.
