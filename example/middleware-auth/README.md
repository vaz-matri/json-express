<img src="../../docs/public/logo-long-light.svg" alt="JSONExpress">

# JWT auth & RBAC example

Protects your API with JWT authentication and adds row- and field-level access rules driven from the model schema. Models a small bookstore: **authors** write **books**, **publishers** release them, and **users** leave private **reviews**.

> New to JSONExpress? Start with the [**`simple`** example](../simple/README.md) — that's the hub that explains the default stack and links to every other plugin.

## Setup

```bash
npm install @json-express/boot @json-express/middleware-auth
```

Set the JWT signing secret in `.env`:

```env
jex__auth__secret=your-secret-key
```

> The framework treats `__` and `.` as nesting separators. `jex__auth__secret` and `jex.auth.secret` are equivalent — uppercase forms work too for cloud platforms that require them.

## Defining access rules

Each model declares who may read/create/update/delete its records. Drop TypeScript model files into `models/`:

```ts
// models/review.ts — owner-scoped, with an admin-only field
export default defineModel({
    fields: {
        id: types.id(),
        bookId: types.string({ required: true }),
        ownerId: types.string(),
        rating: types.number({ required: true, min: 1, max: 5 }),
        body: types.string(),
        moderatorNotes: types.string(),
        book: types.relation({ target: 'book', type: 'many-to-one', foreignKey: 'bookId' }),
    },
    access: {
        read: 'owner',          // each user only sees their own reviews
        create: 'owner',        // auto-stamps caller as owner on POST
        update: 'owner',
        delete: 'owner',
        fields: {
            moderatorNotes: { read: 'admin', create: 'admin', update: 'admin' },
        },
    },
});
```

```ts
// models/book.ts — public reads, role-gated writes
export default defineModel({
    fields: {
        id: types.id(),
        title: types.string({ required: true }),
        authorId: types.string({ required: true }),
        publisherId: types.string({ required: true }),
        author: types.relation({ target: 'author', type: 'many-to-one', foreignKey: 'authorId' }),
        publisher: types.relation({ target: 'publisher', type: 'many-to-one', foreignKey: 'publisherId' }),
    },
    access: {
        read: 'public',
        create: 'admin',
        update: ['admin', 'editor'],
        delete: 'admin',
    },
});
```

`author.ts` and `publisher.ts` follow the same shape as `book.ts` — public read, admin-only writes — and round out the catalog. Drop seed data into `data/book.json`, `data/author.json`, `data/publisher.json`, and `data/review.json`.

## Run it

```bash
npm run serve
```

Issue a JWT signed with the same secret and pass it as a bearer token:

```bash
TOKEN=$(node -e "console.log(require('jsonwebtoken').sign({ sub: 'user-1', role: 'admin' }, 'your-secret-key', { expiresIn: '1h' }))")

curl http://localhost:3000/review -H "Authorization: Bearer $TOKEN"
```

What you'll see:

| Request | Result |
| --- | --- |
| Any request without a token (to a protected route) | `401 Unauthorized` |
| Request with an invalid/expired token | `403 Forbidden` |
| Authenticated user reading `/review` | Only rows where `ownerId` matches their `sub` |
| Non-admin reading a review | `moderatorNotes` field is stripped from the response |
| Anonymous `GET /book` | `200 OK` (read is `public`) |
| Non-admin `POST /book` | `403 Forbidden` |
| Editor `PATCH /book/:id` | `200 OK` (update accepts `[admin, editor]`) |
| Editor `DELETE /book/:id` | `403 Forbidden` (delete is admin-only) |

## What's in this folder

- `package.json` — declares `@json-express/boot`, `@json-express/middleware-auth`, and `jsonwebtoken` (for issuing test tokens)
- `.env` — sets the JWT secret
- `models/` — `book.ts`, `author.ts`, `publisher.ts`, `review.ts` with `access` rules
- `data/` — seed data for each model

## See also

- [`@json-express/middleware-auth`](../../packages/middleware-auth/README.md) — the package's own README
- [`plugin-identity` example](../plugin-identity/) — full signup/login/refresh flow built on top of this middleware
- [`simple` example](../simple/README.md) — the default stack and the directory of every other plugin
