---
title: "@json-express/plugin-health"
description: "Enterprise Kubernetes liveness and readiness probes for JSONExpress."
---

# @json-express/plugin-health

> Official health check plugin for JSONExpress.

The `@json-express/plugin-health` package is a tiny but critical enterprise utility. It automatically mounts strict HTTP endpoints that container orchestrators (like **Kubernetes**) or Cloud Load Balancers (like **AWS ALB**) use to determine if your application is alive and ready to receive traffic.

## Installation

```bash
npm install @json-express/plugin-health
```

## Configuration

The plugin is auto-discovered by the `json-express` runtime — installing the package is enough.

```bash
npm install @json-express/plugin-health
npx json-express
```

By default it exposes two endpoints:

- `GET /health` — liveness
- `GET /ready` — readiness

To match your infrastructure conventions, override the paths in `.env`:

```bash
jex.health.livenessPath=/internal/liveness
jex.health.readinessPath=/internal/readiness
```

## Core Features

### Liveness vs Readiness
It is an industry standard to separate health checks into two distinct probes.

1.  **Liveness Probe (`/health`):** This endpoint simply returns a `200 OK` the moment the Node.js event loop is running. If this endpoint times out or returns a 500, Kubernetes will aggressively kill the Pod and restart it.
2.  **Readiness Probe (`/ready`):** This endpoint actively pings the underlying `IDatabaseAdapter` and checks the connection to the Key-Value store. If the database is unreachable, this endpoint returns a `503 Service Unavailable`. Kubernetes will not kill the Pod, but it will instantly remove it from the Load Balancer so no user traffic is routed to it until the database connection recovers.

### Zero-Overhead Logging
Health probes are typically pinged by Load Balancers every 5 to 10 seconds. If left unchecked, this will completely flood your application access logs and increase your Datadog/CloudWatch billing.

The JSONExpress transport layer automatically detects paths mounted by the Health plugin and **silences their access logs**. You get perfect infrastructure monitoring without the log spam.

## Related Ecosystem Packages
*   **[@json-express/core](/packages/core):** The core engine that orchestrates the boot sequence before marking the `/ready` probe as active.
