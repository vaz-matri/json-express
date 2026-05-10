---
title: "Why I Built JSONExpress: The Problem with json-server in 2026"
description: "json-server was a revelation. But it hasn't kept pace with how developers build today. Here's the gap I kept hitting — and why I built JSONExpress to fill it."
date: 2026-05-01
---

# Why I Built JSONExpress: The Problem with json-server in 2026

I have started a lot of side projects. And for years, the pattern was always the same.

Day one: drop JSON files, run `json-server`, and have a CRUD API in 30 seconds. Perfect. I could build the frontend immediately, move fast, and figure out the real backend later.

Day thirty: the prototype worked. Users liked it. Time to make it real. And that meant: throw away the json-server setup, start an Express app from scratch, write the same CRUD routes by hand, add authentication, wire up a database, re-implement everything I had already built in a different shape.

I did this enough times that it stopped feeling like progress. The 30-second start was great. The cliff you fell off afterwards was not.

---

## The scaffolding cliff

I started calling this the "scaffolding cliff." Tools that are great at the beginning but leave you stranded the moment your needs grow past toy-project level.

json-server is not a bad tool — it has ~75,000 GitHub stars and is genuinely excellent at what it does. The problem is what it cannot do. When you need data to persist across restarts with real write safety, you are on your own. When you need TypeScript schemas with types, constraints, and access control, you are on your own. When you need authentication, the best available option is a community plugin with ~2,000 weekly downloads that does not support modern JWT standards. When you need a real database, you start over.

The tool that helped you on day one is not designed to help you on day thirty. That is the cliff.

---

## The idea

At some point I started asking: what if the same primitive — a schema definition — could power JSON files in development *and* a Postgres database in production? Not by being clever about it, but by making the database an explicit, swappable dependency?

What if every layer of the backend — the database, the HTTP server, the API protocol, the auth system — was an independently installable npm package that implemented a TypeScript interface? So you could start with `adapter-memory` and swap to `adapter-postgres` by changing one line of config, without touching your schemas or hooks?

That was the design constraint I set for v2: **every layer must be replaceable without touching application code.** That single rule forced the entire architecture.

---

## What it forced me to build

The constraint shaped everything.

To make the database swappable, I needed a formal interface that any adapter could implement. That led to `@json-express/core` — a headless microkernel with no HTTP, no database, and no filesystem logic. Just TypeScript interface contracts and a boot sequence.

To make plugins composable without coupling, I needed an IoC container. I used Awilix. The unexpected benefit: plugins physically cannot create circular dependencies — they request dependencies from the kernel, they never import each other directly. The architecture enforces the decoupling at the module level.

To make the config system usable across both local development and Docker, I built Spring Boot-style relaxed binding: `JEX.TRANSPORT.EXPRESS.TRUST_PROXY=true` maps to a nested config object automatically. The double-underscore variant (`JEX__TRANSPORT__EXPRESS__TRUST_PROXY`) works in environments that do not support dots in variable names.

To let community authors build their own adapters with confidence, I built the Adapter Compliance Suite — `runAdapterComplianceTests()` in core. Any adapter that passes the suite is guaranteed to implement the interface correctly. It is like tc39 test262 for database adapters.

---

## The thing that surprised me most

I expected `adapter-memory` and `api-rest` to take the longest. They did not.

`plugin-identity` took the longest, and it became the thing I am most proud of.

The deeper I got into building it, the more I realised how much production auth systems require — and how inaccessible that complexity is in the current tooling landscape. Password hashing that meets OWASP recommendations (Argon2id, memory=64MB, iterations=3). Refresh token rotation to prevent token theft. JWKS support so you can use Auth0, Firebase, or AWS Cognito without rolling your own key management. Anti-enumeration on every auth endpoint — login, forgot-password, verify-resend, logout all return identical responses regardless of whether the email exists.

None of that is exotic. All of it is table stakes for a production auth system. But assembling it correctly from scratch takes days. `plugin-identity` wires all of it up from a single `npm install`, with zero manual route writing.

That is what I wanted the whole project to feel like: genuine production capability that takes one install, not a week.

---

## Where it stands today

JSONExpress v2.0.0 is 23 packages, all MIT licensed, all TypeScript-native. It is the first version I am confident showing publicly. The full stack works end to end: drop JSON files, get REST and GraphQL immediately, add auth with one install, swap your HTTP server with one config line.

The two available database adapters — `adapter-memory` and `adapter-json` — cover development and low-to-medium traffic production workloads. `adapter-memory` runs at ~500K RPS for reads. `adapter-json` uses 50ms debounced atomic writes for file-system persistence.

It is not ready for every production use case yet. I want to be honest about that.

---

## What is coming

The most-requested missing piece is a Postgres adapter. It is on the roadmap and will be the next major package. After that: SQLite (zero-infra production database, huge for students and solo developers), Redis KV store (completes the production auth story for `plugin-identity`), and BullMQ for background jobs.

The one I am most excited about: `plugin-mcp`. A plugin that makes a running JSONExpress instance natively inspectable and modifiable by Claude Code, Cursor, or Codex. The entire architecture — declarative schemas, explicit named adapters, typed interfaces — is already AI-friendly by design. The MCP plugin will make that explicit.

---

## Try it

If any of this resonates — if you have hit the same scaffolding cliff, or you are tired of choosing between "fast to start" and "built to last" — I would genuinely love your feedback.

The best json-server alternative is not one that replaces json-server. It is one that starts exactly where json-server starts, and then keeps going.

[Get started in 60 seconds →](/guide/getting-started)

Star the repo, open an issue, or just try it on your next project. I read everything.
