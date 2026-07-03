# Contributing to JSON Express

This guide is written for **AI agents and humans alike** — most contributions arrive via
the decision ladder's final rung: *"no package covers this need → author it → upstream it."*
A PR that follows this checklist is reviewable in minutes; the conformance suite verifies
most of it mechanically.

## What belongs here

- **A new plugin package** (`packages/<category>-<name>`) — the main contribution type.
  New backing implementations (another database, queue, email provider), new middlewares
  (per-request), new plugins (boot-time services).
- **A new preset** (`presets/preset-<name>`) — a curated dependency bundle, no code.
- Fixes/features to existing packages — update that package's `llms.txt`/`skills/` in the
  same PR (docs are API here; stale docs are a bug).

If the capability needs a **new category prefix** (no matching interface in core), open an
issue proposing the interface first — do not invent prefixes.

## Authoring a plugin package — the contract

Scaffold `packages/<category>-<name>/` with `src/index.ts`, `package.json`, `tsconfig.json`
(copy a sibling package in the same category as your starting point). The loader contract,
enforced by `packages/core/tests/package-conformance.test.ts`:

1. **Anchored name**: `@json-express/<category>-<name>` — the prefix is the discovery
   bucket. Community packages publish as `json-express-<category>-<name>` instead.
2. **One interface**: implement exactly one contract from `@json-express/core`
   (`src/types.ts` is the source of truth). Never import another plugin — communicate via
   container probing (`kernel.container.hasRegistration(...)`), `route.metadata`, or
   `kernel.context`, and degrade silently when an optional peer is absent (required peers:
   throw at boot with an install hint).
3. **Options-object constructor**: `constructor({ configProvider, logger, idGenerator?, database? })`.
   Read your settings from `configProvider.get('<pkg-shortname>.<key>')` (keys are
   case-insensitive; namespace = your package's short name — never squat on another
   package's namespace; `jex.port`, `jex.auth.*`, `jex.docs.*` are the only shared ones).
   Accept direct overrides (e.g. `connectionString`) only as unit-test conveniences.
   Async setup? Expose `static async init(...)` — the loader prefers it over `new`.
4. **Fail loud**: a missing required setting is a boot **error naming the exact `.env` key
   to set** — never a silent default (agents cannot see what doesn't error).
5. **Default export** the class; include `"./package.json": "./package.json"` in the
   exports map; declare `@json-express/core` in `peerDependencies` + `devDependencies`
   (`workspace:^`), never `dependencies`.
6. **Ship AI docs**: `llms.txt` (declarative form: what it is → install → `jex.*` keys →
   what it unlocks in `models/` → "never instantiate manually") and, when the package has
   task-shaped usage, a `skills/<name>/SKILL.md`. Add both to the `files` array.
7. **Optional lifecycle**: implement `shutdown?()` if you hold connections — the kernel
   calls it on teardown.

## Testing — the scenario IS the test

- **Adapters and transports MUST pass the compliance suites** exported by core
  (`runAdapterComplianceTests` / `runTransportComplianceTests`) from a `tests/` folder.
- **Every package adds an `e2e/<scenario>/`**: a mini app (`data/`, optional `models/`,
  `.env` selecting your package via `jex.<category>=...`, `playwright.config.ts` with
  `webServer: { command: 'npm run serve' }`, and a spec exercising the real HTTP surface).
  Real I/O against fixtures — no mocks. If your package needs infrastructure, add a
  `docker-compose.yml` to the scenario (see `e2e/adapter-postgres`).
- All scenarios bind port 3000 — the root `pnpm e2e` runs them sequentially; never run
  e2e suites in parallel.

## PR checklist

```
[ ] pnpm build            # green (typecheck runs as prebuild)
[ ] pnpm test             # green — includes the package-conformance suite
[ ] pnpm e2e              # green, incl. your new e2e/<scenario>
[ ] llms.txt written (declarative form) and in the files array
[ ] changeset added (pnpm changeset) — the whole scope versions together
[ ] no application-code examples anywhere in your docs
```

## Repo conventions

- pnpm monorepo; each package builds with `tsdown` (ESM + CJS + d.ts); `tsconfig.json`
  extends `../../tsconfig.base.json`; add new packages to `tsconfig.check.json`.
- Versioning via changesets; all `@json-express/*` packages are in one fixed group.
- CLAUDE.md at the repo root carries the working conventions for AI agents developing
  the framework itself — read it before your first change.
