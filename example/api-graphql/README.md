# GraphQL API example

Swaps the default REST API for an auto-generated GraphQL schema. Queries, mutations, and relations all come from your model files — no resolver boilerplate.

> New to JSONExpress? Start with the [**`simple`** example](../simple/README.md) — that's the hub that explains the default stack and links to every other plugin.

## Setup

```bash
npm install @json-express/boot @json-express/api-graphql
```

Tell the framework to use GraphQL instead of REST:

```env
jex.api=@json-express/api-graphql
```

Define your models in `models/`:

```ts
// models/artists.ts
export default defineModel({
    fields: {
        id: types.id(),
        name: types.string({ required: true }),
        genre: types.string(),
        albums: types.relation({ target: 'albums', type: 'one-to-many', foreignKey: 'artistId' }),
    },
});

// models/albums.ts
export default defineModel({
    fields: {
        id: types.id(),
        title: types.string({ required: true }),
        artistId: types.string({ required: true }),
        artist: types.relation({ target: 'artists', type: 'many-to-one', foreignKey: 'artistId' }),
    },
});
```

Drop seed data into `data/artists.json` and `data/albums.json`.

## Run it

```bash
npm run serve
```

A single GraphQL endpoint is exposed at `POST /graphql`:

```bash
curl -X POST http://localhost:3000/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"{ albums { id title artist { name genre } } }"}'
```

You get queries, mutations, and relation traversal out of the box:

```graphql
# List with relation expansion
{ albums { id title artist { name genre } } }

# Single record
{ album(id: "alb-1") { title artist { name } } }

# Reverse relation
{ artists { name albums { title } } }

# Mutations
mutation { createAlbum(title: "Random Access Memories", artistId: "art-2") { id } }
```

## Custom GraphQL fields

You can extend the auto-generated schema with computed fields and custom queries directly inside the model:

```ts
// models/artists.ts
export default defineModel({
    fields: { /* ... */ },
    graphql: {
        // Extra computed field on the auto-generated `Artist` type
        typeFields: {
            albumCount: {
                type: GraphQLInt,
                resolve: async (parent, _args, ctx) => {
                    const owned = await ctx.db.search('albums', { artistId: parent.id });
                    return owned.length;
                },
            },
        },
        // Root-level custom query
        queryFields: {
            artistsCount: {
                type: GraphQLInt,
                resolve: async (_, _args, ctx) => (await ctx.db.getAll('artists')).length,
            },
        },
    },
});
```

## What's in this folder

- `package.json` — declares `@json-express/boot` and `@json-express/api-graphql`
- `.env` — points the framework at the GraphQL API generator
- `models/` — TypeScript model definitions with relations and custom GraphQL extensions
- `data/` — seed data for artists and albums

## See also

- [`@json-express/api-graphql`](../../packages/api-graphql/README.md) — the package's own README
- [`class-files` example](../class-files/) — the same model/relation setup served as REST instead of GraphQL
- [`simple` example](../simple/README.md) — the default stack and the directory of every other plugin
