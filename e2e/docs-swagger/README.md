<img src="../../docs/public/logo-long-light.svg" alt="JSONExpress">

# Swagger / OpenAPI docs example

Swaps the default lightweight docs page for [Swagger UI](https://swagger.io/tools/swagger-ui/) backed by an OpenAPI 3.0 spec. You get an interactive "try it out" console at `/docs`, and the spec itself is generated authoritatively from your model definitions — resource grouping, request bodies, and component schemas all derive from `models/*.ts`, not from URL parsing.

> New to JSONExpress? Start with the [**`simple`** example](../simple/README.md) — that's the hub that explains the default stack and links to every other plugin.

## Setup

```bash
npm install @json-express/boot @json-express/docs-swagger
```

Tell the framework to use Swagger instead of the default `docs-light` page:

```env
jex.docs=@json-express/docs-swagger
```

Drop your data into `data/` and (optionally) explicit schemas into `models/`:

```
data/
├── albums.json      # Music albums with artist, genre, RIAA tier
├── artists.json     # Bands and musicians
├── tracks.json      # Songs with duration, explicit flag
└── venues.json      # Concert venues with capacity

models/
└── albums.ts        # Explicit ModelSchema + custom POST /albums/:id/certify
```

JSON files alone are enough — the framework infers a schema from them. Add a `models/<collection>.ts` only when you want stricter field types, validation hints, or **custom routes**.

## Run it

```bash
npm run serve
```

Then open:

| URL | What you get |
| --- | --- |
| `http://localhost:3000/docs` | Swagger UI — interactive API explorer |
| `http://localhost:3000/docs/json` | The raw OpenAPI 3.0 spec |

Click any endpoint, hit **Try it out**, and execute requests directly from the browser. Operations are grouped by resource (Albums, Artists, Tracks, Venues), each with its own component schema under `components.schemas`.

## Custom route demo

`models/albums.ts` adds a domain-specific endpoint alongside the generated CRUD:

```ts
endpoints: {
    'POST /:id/certify': async (req, res, ctx) => {
        // Promote: Gold → Platinum → Diamond
    }
}
```

Try it from the CLI:

```bash
# Find a Gold-tier album
curl http://localhost:3000/albums | jq '.[] | select(.certified == "Gold")'

# Promote it
curl -X POST http://localhost:3000/albums/<id>/certify
# → 200, certified: "Platinum"

# Promote again
curl -X POST http://localhost:3000/albums/<id>/certify
# → 200, certified: "Diamond"

# Once more — already at the top
curl -X POST http://localhost:3000/albums/<id>/certify
# → 409, "already at the top tier (Diamond)"
```

The custom route shows up in Swagger UI under the **Albums** group, automatically.

## What's in this folder

- `package.json` — declares `@json-express/boot` and `@json-express/docs-swagger`
- `.env` — points the framework at the Swagger docs provider
- `data/` — your JSON collections (seed data + inferred schemas)
- `models/albums.ts` — explicit schema with a custom route
- `tests/albums.api.spec.ts` — Playwright suite covering CRUD, the certify endpoint, and the OpenAPI manifest itself

## See also

- [`@json-express/docs-swagger`](../../packages/docs-swagger/README.md) — the package's own README
- [`@json-express/middleware-validation`](../../packages/middleware-validation/README.md) — pair with this to override request schemas via Zod
- [`validation-swagger` example](../validation-swagger/) — shows validation + swagger working together
- [`models-adv` example](../models-adv/) — deeper coverage of model definitions, hooks, and relations
- [`simple` example](../simple/README.md) — the default stack and the directory of every other plugin
