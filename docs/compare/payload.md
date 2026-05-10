---
title: "JSONExpress vs Payload CMS — Without the Next.js Lock-In"
description: "Payload is excellent for Next.js teams. JSONExpress gives you the same code-first TypeScript schemas without requiring Next.js. Works with Vue, Svelte, React Native, or any stack."
---

# JSONExpress vs Payload CMS

Of all the tools in this space, Payload is the one most worth comparing honestly to JSONExpress — because they are the most alike. Both are code-first, TypeScript-native, and schema-driven. Both give you REST and GraphQL from a single schema definition. Both treat access control as a first-class concern defined in code, not configured in a GUI. Payload has ~40,000 GitHub stars, ~5M total npm downloads, and 5x year-over-year growth as of mid-2025. It is a genuinely excellent product.

The comparison is worth making because there is one fundamental architectural assumption that separates them — and it matters a great deal depending on your stack.

---

## The key difference

Payload assumes Next.js. JSONExpress assumes nothing.

Payload's tagline is "The Next.js Headless CMS and App Framework." It installs directly into your Next.js `/app` folder, uses Next.js server actions, and its admin UI is a React application that runs inside your Next.js project. This is a deliberate and well-executed design — if you are building in Next.js, Payload's integration is seamless and genuinely powerful.

If you are not building in Next.js — if your frontend is Vue, Svelte, Astro, React Native, or plain HTML, or if you have no frontend at all and just need an API — Payload's architecture becomes friction rather than a feature. JSONExpress is framework-agnostic by design: it runs as a standalone Node.js process, works with any frontend or none, and lets you choose your HTTP server independently of everything else.

---

## The schemas look nearly identical

The most important thing to understand about both tools is that the developer experience of defining schemas is very similar. If you have used Payload, JSONExpress will feel familiar immediately.

**Payload collection:**

```typescript
import type { CollectionConfig } from 'payload/types';

export const Posts: CollectionConfig = {
  slug: 'posts',
  fields: [
    { name: 'title', type: 'text', required: true, unique: true },
    { name: 'published', type: 'checkbox', defaultValue: false },
    { name: 'views', type: 'number', defaultValue: 0 },
  ],
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
};
```

**JSONExpress model:**

```typescript
import { defineModel, types } from '@json-express/core';

export default defineModel({
  name: 'posts',
  fields: {
    id: types.id(),
    title: types.string({ required: true, unique: true }),
    published: types.boolean({ default: false }),
    views: types.number({ default: 0 })
  },
  access: {
    read: 'public',
    create: 'admin',
    update: 'owner',
    delete: 'admin'
  }
});
```

Both define fields with types, constraints, and default values. Both define access control per operation. The structural similarity is intentional — schema-driven TypeScript is the right model for this kind of tool. The difference is what happens when you run the server.

---

## When Payload is the right choice

Payload is the better tool if:

- **You are building in Next.js.** The integration is native and seamless — Payload installs into your `/app` folder and shares the same deployment. There is no better option for this stack.
- **Your team is React-native.** Payload's admin UI is a React application. If your entire team works in React, this is a comfortable and productive environment.
- **You want an admin UI that lives in your application.** Payload's admin panel is co-located with your Next.js app, not a separate service. For teams that want a content editing interface without running a separate CMS, this is a strong advantage.
- **You want Figma backing and resources.** Payload was acquired by Figma in June 2025. The release cadence has not changed, but Figma's resources and distribution are now behind it.
- **You need an MCP server today.** `@payloadcms/plugin-mcp` is out of beta. JSONExpress's MCP plugin is on the roadmap but not yet shipped.

---

## When JSONExpress makes more sense

JSONExpress is the better fit if:

- **You are not using Next.js.** Vue, Svelte, Astro, React Native, vanilla HTML — JSONExpress works with all of them identically. There is no framework assumption anywhere in the stack.
- **You want to start with JSON files before writing TypeScript.** Payload is always code-first from day one. JSONExpress lets you drop a `posts.json` and get a running API in 30 seconds, then graduate to TypeScript schemas when you are ready.
- **You need to swap your HTTP server.** Payload runs on the Next.js server and cannot be replaced. JSONExpress lets you choose between Express and Fastify, with more transports on the roadmap.
- **You prefer independent ownership.** Payload is now owned by Figma. For some teams, independent MIT-licensed ownership matters — for others it does not. JSONExpress is independently developed with no acquisition, no corporate parent, and no enterprise upsell.
- **You want a zero-config prototype path.** JSONExpress goes from JSON file to production TypeScript backend in a straight line. Payload starts at TypeScript and does not have the JSON file mode.

---

## Side-by-side comparison

| Feature | Payload | JSONExpress |
|---|---|---|
| Code-first TypeScript schemas | ✅ | ✅ |
| Zero-config JSON mode | ❌ | ✅ |
| Next.js integration | ✅ Native | ✅ Works with any frontend |
| Next.js required | ⚠️ Effectively yes | ❌ Framework-agnostic |
| GraphQL | ✅ | ✅ |
| REST API | ✅ | ✅ |
| Built-in auth | ✅ | ✅ |
| Swap HTTP server | ❌ Next.js server | ✅ Express or Fastify |
| MCP server | ✅ Shipped | 🗓️ Planned |
| License | MIT | MIT |
| Ownership | Figma (acquired Jun 2025) | Independent |
| GitHub stars | ~40,000 | Early stage |

---

## A note on the Figma acquisition

Payload was acquired by Figma in June 2025. The Payload team has stated the release cadence is unchanged and the product roadmap continues as planned. There is no reason to doubt that — Figma is a well-run company and Payload is a strategic addition to their developer tooling ecosystem.

For most teams, this makes no difference. If you are already using Payload and happy with it, nothing has changed.

For teams where independent open-source ownership is a decision criterion — the kind of teams who were burned by the Strapi and Directus BSL changes, or who have policies around acquired dependencies — it is a relevant data point. JSONExpress is independently developed, MIT licensed, and has no corporate acquisition in its history.

---

## The honest summary

If you are building in Next.js with a React team and want seamless framework integration, an admin UI co-located in your app, and a mature tool with Figma's resources behind it — use Payload. It is excellent at what it does.

If you are building outside of Next.js, want to start with JSON files before committing to TypeScript, need to choose your own HTTP server, or prefer independent ownership — JSONExpress gives you the same code-first TypeScript DX without the framework assumption.

---

**Ready to try it?** [Get started in 60 seconds →](/guide/getting-started)
