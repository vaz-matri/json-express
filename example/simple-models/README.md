<img src="../../docs/public/logo-long-light.svg" alt="JSONExpress">

# TypeScript models example

Switch from inferred schemas (one JSON file = one collection, types guessed from the first row) to explicit TypeScript model files. You get strict typing, custom field types beyond what inference can detect, constraints, defaults, and relations between collections.

> New to JSONExpress? Start with the [**`simple`** example](../simple/README.md) — that's the hub that explains the default stack and links to every other plugin.
>
> Looking for hooks, custom endpoints, or `exposeApi: false`? Those live in the [`models-adv`](../models-adv/README.md) example.

## Setup

```bash
npm install @json-express/boot
```

That's it — no extra adapter required. This example uses the default in-memory adapter so the model's `relation` definitions drive `_expand` directly. (For file-backed persistence, see [`adapter-json`](../adapter-json/README.md); its relation handling uses an embedded `{ ref, id }` envelope rather than the schema, so it's a separate showcase.)

Define your models in `models/`. Two equivalent styles are shown — pick whichever you prefer:

```ts
// models/artists.ts — options-object style
export default defineModel({
    fields: {
        id: types.id(),
        name: types.string({ required: true, minLength: 1, maxLength: 200, unique: true }),
        genre: types.string({ default: 'Unspecified' }),
        active: types.boolean({ default: true }),
        foundedYear: types.number({ min: 1900, max: 2100 }),
        signedAt: types.date(),
        albums: types.relation({ target: 'albums', type: 'one-to-many', foreignKey: 'artistId' })
    }
});

// models/albums.ts — fluent-builder (zod-like) style
export default defineModel({
    fields: {
        id: types.id(),
        title: types.string().required().minLength(1).maxLength(200),
        artistId: types.string().required(),
        releaseYear: types.number().min(1900).max(2100),
        explicit: types.boolean().default(false),
        artist: types.relation({ target: 'artists', type: 'many-to-one', foreignKey: 'artistId' })
    }
});
```

Seed both collections in `data/` (the filename becomes the collection name):

```
data/
├── albums.json     # [{ "id": "alb-1", "title": "Abbey Road", "artistId": "art-1", ... }]
└── artists.json    # [{ "id": "art-1", "name": "The Beatles", "genre": "Rock", ... }]
```

## Run it

```bash
npm run serve
```

## Field types

| Helper | What you get |
| --- | --- |
| `types.id()` | Primary key. Auto-assigned on `POST` if you don't supply one; preserved if you do |
| `types.string(opts?)` | UTF-8 string |
| `types.number(opts?)` | JS number, preserved across the wire |
| `types.boolean(opts?)` | True/false, never coerced |
| `types.date(opts?)` | ISO timestamp; stored as-is, typed as date in OpenAPI |
| `types.relation(opts)` | Link to another collection — see [Relations](#relations) |

Inference (the `simple` example) reads only the first record of each JSON file and guesses the column types. That works for prototypes but can't reliably detect booleans, dates, or numbers that arrive as strings. Declaring the type in a model file pins it for the whole schema.

## Authoring styles — same options, two flavors

Every helper accepts either an options object **or** chained method calls. The framework treats them identically — pick whichever reads better in your file.

```ts
// Options-object form
types.string({ required: true, unique: true, maxLength: 200 })

// Fluent-builder form (zod-like, every option becomes a chainable method)
types.string().required().unique().maxLength(200)
```

`models/artists.ts` shows the object form throughout; `models/albums.ts` shows the fluent form.

## Field options

| Option | Applies to | Runtime behavior | Notes |
| --- | --- | --- | --- |
| `required` | all | **Metadata only** — surfaced in OpenAPI; pair with [`middleware-validation`](../../packages/middleware-validation/README.md) to reject at the HTTP boundary | |
| `default` | all | **Metadata only** — surfaced in OpenAPI/swagger; not auto-applied to inserts | |
| `unique` | all | **Enforced** — duplicate writes return `400` (`UniqueConstraintError`) | |
| `index` | all | **Not yet implemented** — currently a no-op kept for forward compatibility | |
| `minLength` / `maxLength` | string | Metadata only | |
| `min` / `max` | number | Metadata only | |

The split between "enforced" and "metadata only" is intentional: it keeps `core` free of validator opinions and lets you choose Zod, Yup, Valibot, or none at all. To enforce metadata constraints at runtime, install [`middleware-validation`](../../packages/middleware-validation/README.md) and pair it with a Zod schema (see the [`validation-swagger`](../validation-swagger/README.md) example).

### `unique` is enforced

```bash
curl -X POST http://localhost:3000/artists \
  -H 'content-type: application/json' \
  -d '{"name":"The Beatles"}'
# → 400  { "error": "..." }
```

## Relations

`types.relation()` declares a link to another collection. The in-memory adapter hydrates it on demand via the `_expand` query parameter; without `_expand`, only the foreign-key column appears in responses and the relation field is omitted.

### The four relation types

| Type | Where the FK lives | Returned shape |
| --- | --- | --- |
| `many-to-one` | On **this** record | Single object (or `null`) |
| `one-to-one` | On **this** record | Single object (or `null`) |
| `one-to-many` | On the **target** record (inverse) | Array |
| `many-to-many` | On the **target** record (inverse) | Array — see caveat below |

```ts
// many-to-one: an album belongs to one artist
artist: types.relation({ target: 'artists', type: 'many-to-one', foreignKey: 'artistId' })

// one-to-one: a user has one profile (FK on the user side)
profile: types.relation({ target: 'profiles', type: 'one-to-one', foreignKey: 'profileId' })

// one-to-many: an artist has many albums (no FK on artist; albums.artistId points back)
albums: types.relation({ target: 'albums', type: 'one-to-many', foreignKey: 'artistId' })

// many-to-many: see caveat — currently behaves like one-to-many
tags: types.relation({ target: 'tags', type: 'many-to-many', foreignKey: 'albumId' })
```

> **Caveat.** True many-to-many usually requires a junction table (e.g. `album_tags`). The adapter does **not** model this today — `many-to-many` is treated identically to `one-to-many` (filter target rows where their FK matches this id). Use `one-to-many` for now and revisit when junction-table support lands.

### `foreignKey` conventions

If you omit `foreignKey`, the adapter falls back to:

| Direction | Convention |
| --- | --- |
| Forward (`many-to-one`, `one-to-one`) | `${fieldName}Id` — e.g. an `artist` field on albums looks up `albums.artistId` |
| Inverse (`one-to-many`, `many-to-many`) | `${parentSingular}Id` — e.g. an `albums` field on `artists` looks up `albums.artistId` (singularized via a basic `s` / `ies` rule) |

These conventions match what's in `data/`, so the explicit `foreignKey` lines in this example's models could be omitted and behaviour would be identical. They're kept for readability.

### Expanding relations

```bash
# Forward (many-to-one): album carries artistId, _expand hydrates the artist record
curl http://localhost:3000/albums/alb-1?_expand=artist

# Inverse (one-to-many): artist has no FK, _expand walks albums where artistId === art-1
curl http://localhost:3000/artists/art-1?_expand=albums

# Multiple at once — comma-separated
curl 'http://localhost:3000/albums/alb-1?_expand=artist'
curl 'http://localhost:3000/artists/art-1?_expand=albums'

# Works on lists too
curl 'http://localhost:3000/albums?_expand=artist'
curl 'http://localhost:3000/artists?_expand=albums'
```

`_expand` accepts a comma-separated list of field names from the current model. Nested expansion (e.g. `_expand=artist.albums`) is **not** supported — issue follow-up requests on the expanded record's id if you need to walk a graph.

### `onDelete`

`types.relation({ ..., onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT' })` is in the type definition for forward compatibility, but **no adapter enforces it today**. Deletes fire regardless of the option's value — orphan records are not cleaned up. Treat it as a documentation hint until adapter support lands.

## Schema-level options

`defineModel` accepts a few options beyond `fields`. They're documented here for completeness, but most live in [`models-adv`](../models-adv/README.md):

| Option | Purpose | Demo |
| --- | --- | --- |
| `fields` | Field definitions (covered above) | this example |
| `hooks` | Lifecycle callbacks (`beforeCreate` / `afterCreate` / `beforeUpdate` / `afterUpdate`) | [`models-adv`](../models-adv/README.md) |
| `endpoints` | Custom routes mounted alongside auto-CRUD | [`models-adv`](../models-adv/README.md) |
| `access` | Per-op + per-field auth rules | [`middleware-auth`](../middleware-auth/README.md) |
| `graphql` | Custom resolvers layered on the auto schema | [`api-graphql`](../api-graphql/README.md) |
| `exposeApi` | Set `false` to hide a model from auto-CRUD/GraphQL | [`models-adv`](../models-adv/README.md) |
| `name` | **Currently a no-op for file-loaded models** — the schema loader overrides `name` with the filename. Documented for forward-compat | — |

## What this folder contains

- `package.json` — declares only `@json-express/boot`
- `models/` — TypeScript model definitions (one file per collection)
- `data/` — seed data, picked up by the in-memory adapter on boot
- `tests/` — Playwright specs covering CRUD, both relation directions, typed fields, and the unique constraint

## See also

- [`@json-express/core`](../../packages/core/README.md) — `defineModel`, `types`, relation helpers
- [`models-adv`](../models-adv/README.md) — hooks, endpoints, and `exposeApi: false` working together
- [`simple` example](../simple/README.md) — the default stack and the directory of every other plugin
