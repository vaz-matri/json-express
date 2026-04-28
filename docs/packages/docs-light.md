---
title: "@json-express/docs-light"
description: "A zero-dependency, lightweight API documentation UI for JSONExpress with glassmorphism design."
---

# @json-express/docs-light

> The default lightweight API documentation provider for JSONExpress.

The `@json-express/docs-light` package implements `IDocProvider` and generates a beautiful, self-contained HTML page that lists every route in your JSONExpress application. It requires zero external CDN assets and renders instantly.

This is the **default** documentation provider bundled with the `@json-express/cli`.

## Installation

```bash
npm install @json-express/docs-light
```

## What It Generates

When you boot your JSONExpress server, the docs-light provider automatically mounts two endpoints:
*   `GET /docs` — A visually stunning HTML page with a dark glassmorphism UI, grouped by resource.
*   `GET /docs/json` — A raw JSON manifest of every registered route (useful for CI/CD and automated testing).

### Visual Design
The generated documentation page features:
*   **Outfit** and **JetBrains Mono** fonts loaded from Google Fonts.
*   Color-coded HTTP method badges (green for GET, amber for POST, blue for PATCH, red for DELETE).
*   Resource grouping (e.g., all `/users/*` routes are grouped under a "Users" card).
*   Middleware badge indicators showing how many security layers protect each route.

## Core Features

### 1. Dynamic Base URL Detection
The documentation page dynamically resolves your API's base URL by inspecting:
1. **Proxy headers** (`x-forwarded-proto`, `x-forwarded-host`) — for production reverse-proxy deployments.
2. **Request metadata** (`req.protocol`, `req.hostname`) — for direct local access.
3. **Configuration overrides** (`docs.baseUrl`) — for enterprise hardcoded URLs.

This ensures the displayed base URL is always accurate, whether you are running locally, behind Nginx, or inside a Kubernetes Ingress.

### 2. Zero External Dependencies
Unlike `@json-express/docs-swagger` (which loads the Swagger UI from a CDN), docs-light generates a completely self-contained HTML string. There are no external JavaScript bundles, no iframes, and no runtime dependencies. The page loads in under 50ms.

## Related Ecosystem Packages
*   **[@json-express/docs-swagger](/packages/docs-swagger):** The heavier, fully interactive Swagger alternative with "Try It" functionality.
*   **[@json-express/plugin-health](/packages/plugin-health):** The docs-light footer automatically links to the `/health` endpoint.
