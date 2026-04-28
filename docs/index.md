---
layout: home
title: JSONExpress — From JSON to Enterprise API in 0 Seconds
description: The open-source Node.js meta-framework that turns raw JSON files into production-ready REST and GraphQL APIs with built-in identity, security, and pluggable databases.

hero:
  name: "JSONExpress"
  text: "JSON → API"
  tagline: "Drop a JSON file. Get REST & GraphQL. Scale using TypeScript when you're ready."
  actions:
    - theme: brand
      text: ⚡ Get Started in 60 Seconds
      link: /guide/getting-started
    - theme: alt
      text: 📖 Read the Architecture
      link: /guide/architecture

features:
  - icon: 📄
    title: Zero-Config JSON Mode
    details: Drop a .json file into /data and get a full CRUD API instantly — no code, no config, no database setup required.
    link: /guide/json-mode
    linkText: Learn more →
  - icon: 🔀
    title: Dual API Generation
    details: One schema, two protocols. Automatically generate both REST endpoints and a fully-typed GraphQL API with N+1 optimization.
    link: /plugins/api
    linkText: Learn more →
  - icon: 🛡️
    title: Zero-Knowledge Identity
    details: Enterprise auth with Argon2 hashing, JWT revocation via tokenVersion, and asymmetric JWKS support for Auth0 & Cognito.
    link: /plugins/identity
    linkText: Learn more →
  - icon: 🔌
    title: 23 Pluggable Packages
    details: Swap databases, transports, loggers, and queues without changing your application code. Install only what you need.
    link: /packages/core
    linkText: Explore ecosystem →
  - icon: 🏗️
    title: Progressive Disclosure
    details: Prototype with JSON in minutes. Eject to strict TypeScript schemas when you need hooks, relations, and field-level security.
    link: /guide/schemas
    linkText: Learn more →
  - icon: ✅
    title: Adapter Compliance Suite
    details: Build your own database adapter and verify it passes every contract using our automated test harness.
    link: /guide/adapters
    linkText: Learn more →
---

## How It Works — 3 Steps

From an empty folder to a production-grade API in under a minute.

<div class="steps-grid">
<div class="step-card">
<div class="step-number">1</div>
<h3>Drop a JSON File</h3>
<p>Create <code>data/posts.json</code> with your seed data. No schema, no database, no config file needed.</p>
</div>
<div class="step-card">
<div class="step-number">2</div>
<h3>Boot the Server</h3>
<p>Run <code>npx json-express</code>. The Kernel infers the schema, wires the database, and generates the API.</p>
</div>
<div class="step-card">
<div class="step-number">3</div>
<h3>Ship It</h3>
<p>Your REST and GraphQL endpoints are live. <code>GET</code>, <code>POST</code>, <code>PATCH</code>, <code>DELETE</code> — all ready.</p>
</div>
</div>



## Define Once, Generate Everything

Write a 15-line TypeScript model. Get enterprise-grade REST, GraphQL, validation, and security for free.

```typescript
// models/users.ts — Your entire backend definition
import { defineModel, types } from '@json-express/core';

export default defineModel({
    name: 'users',
    access: {
        read: 'public',
        create: 'admin',         // Only admins can create users
        update: 'owner'          // Only the user can edit themselves
    },
    fields: {
        id: types.id(),
        email: types.string({ unique: true }),
        role: types.string({ default: 'user' }),
        passwordHash: types.string({ access: { read: false } })
        // ↑ This field is physically impossible to query via REST or GraphQL
    }
});
```

```graphql
# What you get — automatically generated GraphQL
query {
  users(limit: 10, where: { role: "admin" }) {
    id
    email
    role
    # passwordHash → does not exist in the schema
  }
}

# REST equivalents also auto-generated:
# GET    /users?role=admin&_limit=10
# POST   /users        → 403 unless JWT role === "admin"
# PATCH  /users/1      → 403 unless JWT sub === record.userId
```



## Enterprise Architecture — 5 Stage Boot Pipeline

Every JSONExpress application follows a strict, deterministic lifecycle.

<div class="pipeline">
<div class="pipeline-stage">
<div class="stage-icon">⚙️</div>
<h4>Configure</h4>
<p>Load .env, YAML, or TypeScript config files</p>
</div>
<div class="pipeline-arrow">→</div>
<div class="pipeline-stage">
<div class="stage-icon">🔍</div>
<h4>Discover</h4>
<p>CLI scans package.json and auto-discovers plugins</p>
</div>
<div class="pipeline-arrow">→</div>
<div class="pipeline-stage">
<div class="stage-icon">🧬</div>
<h4>Schema</h4>
<p>Merge TypeScript models with inferred JSON schemas</p>
</div>
<div class="pipeline-arrow">→</div>
<div class="pipeline-stage">
<div class="stage-icon">🔗</div>
<h4>Generate</h4>
<p>Compile routes, autowire middleware, enforce access</p>
</div>
<div class="pipeline-arrow">→</div>
<div class="pipeline-stage">
<div class="stage-icon">🚀</div>
<h4>Serve</h4>
<p>Bind routes to Express or Fastify and start listening</p>
</div>
</div>



## The Complete Ecosystem — 23 Packages

Every package is independently installable. Use only what you need.

<div class="eco-grid">
<div class="eco-category">
<h3>🧠 Core & CLI</h3>
<a href="/packages/core" class="eco-pkg">@json-express/core</a>
<a href="/packages/cli" class="eco-pkg">@json-express/cli</a>
<a href="/packages/config" class="eco-pkg">@json-express/config</a>
<a href="/packages/config-env" class="eco-pkg">@json-express/config-env</a>
</div>
<div class="eco-category">
<h3>🌐 Transports</h3>
<a href="/packages/transport-express" class="eco-pkg">@json-express/transport-express</a>
<a href="/packages/transport-fastify" class="eco-pkg">@json-express/transport-fastify</a>
</div>
<div class="eco-category">
<h3>🗄️ Database Adapters</h3>
<a href="/packages/adapter-json" class="eco-pkg">@json-express/adapter-json</a>
<a href="/packages/adapter-memory" class="eco-pkg">@json-express/adapter-memory</a>
</div>
<div class="eco-category">
<h3>⚡ API Generators</h3>
<a href="/packages/api-rest" class="eco-pkg">@json-express/api-rest</a>
<a href="/packages/api-graphql" class="eco-pkg">@json-express/api-graphql</a>
</div>
<div class="eco-category">
<h3>🛡️ Security</h3>
<a href="/packages/middleware-auth" class="eco-pkg">@json-express/middleware-auth</a>
<a href="/packages/middleware-validation" class="eco-pkg">@json-express/middleware-validation</a>
<a href="/packages/plugin-identity" class="eco-pkg">@json-express/plugin-identity</a>
</div>
<div class="eco-category">
<h3>🔧 Plugins</h3>
<a href="/packages/plugin-health" class="eco-pkg">@json-express/plugin-health</a>
<a href="/packages/plugin-devcert" class="eco-pkg">@json-express/plugin-devcert</a>
<a href="/packages/docs-swagger" class="eco-pkg">@json-express/docs-swagger</a>
<a href="/packages/docs-light" class="eco-pkg">@json-express/docs-light</a>
</div>
<div class="eco-category">
<h3>⏳ Background Services</h3>
<a href="/packages/kv-memory" class="eco-pkg">@json-express/kv-memory</a>
<a href="/packages/kv-redis" class="eco-pkg">@json-express/kv-redis</a>
<a href="/packages/queue-memory" class="eco-pkg">@json-express/queue-memory</a>
<a href="/packages/queue-bullmq" class="eco-pkg">@json-express/queue-bullmq</a>
<a href="/packages/email-console" class="eco-pkg">@json-express/email-console</a>
</div>
<div class="eco-category">
<h3>🛠️ Utilities</h3>
<a href="/packages/logger-pino" class="eco-pkg">@json-express/logger-pino</a>
<a href="/packages/logger-console" class="eco-pkg">@json-express/logger-console</a>
<a href="/packages/seeder-faker" class="eco-pkg">@json-express/seeder-faker</a>
</div>
</div>



## Why JSONExpress?

Compare JSONExpress to what you're already using.

| Feature | JSONExpress | JSON Server | Strapi | Hand-coded |
|---|---|---|---|---|
| Zero-config JSON API | ✅ | ✅ | ❌ | ❌ |
| TypeScript Schema Ejection | ✅ | ❌ | ❌ | ✅ |
| GraphQL + REST (simultaneous) | ✅ | ❌ | ✅ | ❌ |
| Field-Level Access Control | ✅ | ❌ | ✅ | Manual |
| Pluggable Database Adapters | ✅ | ❌ | ✅ | Manual |
| Swap Express ↔ Fastify | ✅ | ❌ | ❌ | ❌ |
| Argon2 + JWT out of the box | ✅ | ❌ | ✅ | Manual |
| N+1 Query Resolution | ✅ | ❌ | ❌ | Manual |
| Adapter Compliance Suite | ✅ | ❌ | ❌ | ❌ |



## Security Built Into the DNA

Not bolted on as an afterthought. Every layer enforces your rules.

<div class="security-grid">
<div class="security-card">
<div class="security-icon">🔐</div>
<h4>Zero-Knowledge Passwords</h4>
<p>Plain-text passwords never touch your database. Argon2 hashing is enforced via <code>beforeCreate</code> hooks in the <a href="/packages/plugin-identity">Identity Plugin</a>.</p>
</div>
<div class="security-card">
<div class="security-icon">🚫</div>
<h4>Field-Level Stripping</h4>
<p>Mark any field as <code>access: { read: false }</code> and the <a href="/packages/api-rest">REST</a> and <a href="/packages/api-graphql">GraphQL</a> generators will physically delete it from every response.</p>
</div>
<div class="security-card">
<div class="security-icon">⏱️</div>
<h4>Instant JWT Revocation</h4>
<p>Increment <code>tokenVersion</code> in the database. All previously issued tokens are instantly rejected by the <a href="/packages/middleware-auth">Auth Middleware</a>.</p>
</div>
<div class="security-card">
<div class="security-icon">🧹</div>
<h4>Anti-Spoofing Headers</h4>
<p>The Auth middleware always deletes <code>x-user-payload</code> from incoming requests before re-injecting the cryptographically verified payload.</p>
</div>
</div>



## Frequently Asked Questions

<details class="faq-item">
<summary>What is JSONExpress?</summary>
<p>JSONExpress is an open-source Node.js meta-framework that automatically generates production-ready REST and GraphQL APIs from raw JSON files or declarative TypeScript schemas. It provides built-in identity management, field-level security, and pluggable database adapters.</p>
</details>

<details class="faq-item">
<summary>Is JSONExpress a database?</summary>
<p>No. JSONExpress is an execution engine that sits between your HTTP server and your database. It uses the <code>IDatabaseAdapter</code> interface to communicate with any database — RAM, JSON files, PostgreSQL, or MySQL — without coupling to any specific driver.</p>
</details>

<details class="faq-item">
<summary>Can I use JSONExpress with Auth0 or Firebase?</summary>
<p>Yes. The <a href="/packages/middleware-auth">Auth Middleware</a> supports both symmetric HMAC secrets (for local JWT signing) and asymmetric JWKS endpoints (for Auth0, AWS Cognito, and Firebase). Simply provide your <code>jwksUri</code> in the configuration.</p>
</details>

<details class="faq-item">
<summary>How does JSONExpress solve the GraphQL N+1 problem?</summary>
<p>The <a href="/packages/api-graphql">GraphQL Generator</a> intercepts deeply nested AST queries and translates them into flat <code>QueryOptions.expand</code> arrays. The Database Adapter then resolves all relations in a single optimized pass instead of issuing N+1 separate queries.</p>
</details>

<details class="faq-item">
<summary>Can I run REST and GraphQL at the same time?</summary>
<p>Yes. Mount the <a href="/packages/api-rest">REST Generator</a> and the <a href="/packages/api-graphql">GraphQL Generator</a> simultaneously. Both share the same schemas, database adapter, and security rules.</p>
</details>

<details class="faq-item">
<summary>Can I swap from Express to Fastify?</summary>
<p>Yes. Replace <code>@json-express/transport-express</code> with <code>@json-express/transport-fastify</code> in your <code>package.json</code>. Because all route handlers use the abstract <code>JsonRequest</code> and <code>JsonResponse</code> interfaces, your application code requires zero changes.</p>
</details>

<details class="faq-item">
<summary>How do I build a custom database adapter?</summary>
<p>Implement the <code>IDatabaseAdapter</code> interface from <a href="/packages/core">@json-express/core</a>, then verify your implementation by running the built-in <a href="/guide/adapters">Adapter Compliance Suite</a>. If it passes, your adapter is guaranteed to work with every JSONExpress plugin.</p>
</details>



<div class="cta-section">
<h2>Ready to Build?</h2>
<p class="section-subtitle">Get your first API running in under 60 seconds.</p>
<div class="cta-install">
<code>npm install @json-express/cli && npx json-express</code>
</div>
<div class="cta-buttons">
<a href="/guide/getting-started" class="cta-btn cta-primary">Get Started</a>
<a href="/guide/json-mode" class="cta-btn cta-secondary">Try JSON Mode</a>
<a href="/guide/architecture" class="cta-btn cta-secondary">Read Architecture</a>
</div>
</div>

<footer class="site-footer">
<div class="footer-grid">
<div class="footer-col">
<h4>JSONExpress</h4>
<p class="footer-tagline">From JSON to Enterprise API in 0 seconds. Open-source Node.js meta-framework.</p>
</div>
<div class="footer-col">
<h4>Learn</h4>
<a href="/guide/getting-started">Getting Started</a>
<a href="/guide/json-mode">Zero-Config JSON Mode</a>
<a href="/guide/architecture">Architecture</a>
<a href="/guide/schemas">Schemas & Models</a>
<a href="/guide/hooks">Hooks & Security</a>
</div>
<div class="footer-col">
<h4>Ecosystem</h4>
<a href="/packages/core">Core</a>
<a href="/packages/api-rest">REST Generator</a>
<a href="/packages/api-graphql">GraphQL Generator</a>
<a href="/packages/plugin-identity">Identity Plugin</a>
<a href="/packages/middleware-auth">Auth Middleware</a>
</div>
<div class="footer-col">
<h4>Community</h4>
<a href="https://github.com/vazmat/json-express">GitHub</a>
<a href="https://github.com/vazmat/json-express/issues">Issues</a>
<a href="https://github.com/vazmat/json-express/discussions">Discussions</a>
</div>
</div>
<div class="footer-bottom">
<p>Released under the MIT License. © 2026 JSONExpress Contributors.</p>
</div>
</footer>

<style>
/* ═══════════════ SCOPED LANDING STYLES ═══════════════ */
/* Force content width to match the VitePress hero/features container */
.VPHome .vp-doc {
  max-width: 1152px !important;
  margin: 0 auto !important;
  padding: 0 24px !important;
}
/* Kill VitePress default bottom margin on home page */
.VPHome {
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}
/* Remove default VitePress h2 border-top dividers on landing page */
.VPHome .vp-doc h2 {
  border-top: none !important;
  margin-top: 4rem;
  padding-top: 0 !important;
}
/* Force comparison table to fill the full container width */
.VPHome .vp-doc table {
  width: 100% !important;
  display: table !important;
}
.VPHome .vp-doc table th,
.VPHome .vp-doc table td {
  text-align: center;
}
.VPHome .vp-doc table th:first-child,
.VPHome .vp-doc table td:first-child {
  text-align: left;
  width: 35%;
}

/* ═══════════════ STEPS GRID ═══════════════ */
.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  margin-top: 1.5rem;
}
.step-card {
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 1.5rem;
  transition: border-color 0.25s, transform 0.25s;
}
.step-card:hover {
  border-color: var(--solarized-cyan);
  transform: translateY(-3px);
}
.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--solarized-cyan);
  color: #002b36;
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 0.75rem;
}
.step-card h3 { margin: 0 0 0.5rem !important; font-size: 1.15rem; border: none !important; padding: 0 !important; }
.step-card p { font-size: 0.95rem; color: var(--vp-c-text-2); margin: 0; }

/* ═══════════════ ARCHITECTURE PIPELINE ═══════════════ */
.pipeline {
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 0.25rem;
  flex-wrap: wrap;
  margin-top: 1.5rem;
}
.pipeline-stage {
  flex: 1;
  min-width: 100px;
  text-align: center;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 1.25rem 0.75rem;
  transition: border-color 0.25s, transform 0.25s;
}
.pipeline-stage:hover {
  border-color: var(--solarized-cyan);
  transform: translateY(-2px);
}
.stage-icon { font-size: 1.75rem; margin-bottom: 0.5rem; }
.pipeline-stage h4 { margin: 0 0 0.35rem !important; font-size: 0.95rem; border: none !important; padding: 0 !important; }
.pipeline-stage p { font-size: 0.8rem; color: var(--vp-c-text-2); margin: 0; }
.pipeline-arrow {
  font-size: 1.4rem;
  color: var(--solarized-cyan);
  display: flex;
  align-items: center;
  font-weight: 700;
}

/* ═══════════════ ECOSYSTEM GRID ═══════════════ */
.eco-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.25rem;
  margin-top: 1.5rem;
}
.eco-category {
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 1.25rem;
  transition: border-color 0.25s;
}
.eco-category:hover { border-color: var(--solarized-cyan); }
.eco-category h3 { margin: 0 0 0.75rem !important; font-size: 1.05rem; border: none !important; padding: 0 !important; }
.eco-pkg {
  display: block;
  font-family: var(--vp-font-family-mono);
  font-size: 0.85rem;
  padding: 0.35rem 0.5rem;
  margin-bottom: 0.3rem;
  border-radius: 6px;
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
}
.eco-pkg:hover {
  background: var(--solarized-cyan);
  color: #002b36;
}

/* ═══════════════ SECURITY GRID ═══════════════ */
.security-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
  margin-top: 1.5rem;
}
.security-card {
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 1.5rem;
  transition: border-color 0.25s, transform 0.25s;
}
.security-card:hover {
  border-color: var(--solarized-cyan);
  transform: translateY(-2px);
}
.security-icon { font-size: 1.75rem; margin-bottom: 0.5rem; }
.security-card h4 { margin: 0 0 0.5rem !important; font-size: 1.1rem; border: none !important; padding: 0 !important; }
.security-card p { font-size: 0.95rem; color: var(--vp-c-text-2); margin: 0; }
.security-card a { color: var(--solarized-cyan); text-decoration: none; }
.security-card a:hover { text-decoration: underline; }

/* ═══════════════ FAQ ═══════════════ */
.faq-item {
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 10px;
  margin-bottom: 0.75rem;
  transition: border-color 0.25s;
}
.faq-item:hover, .faq-item[open] { border-color: var(--solarized-cyan); }
.faq-item summary {
  padding: 1rem 1.25rem;
  font-weight: 600;
  font-size: 1.05rem;
  cursor: pointer;
}
.faq-item p {
  padding: 0 1.25rem 1rem;
  font-size: 0.95rem;
  color: var(--vp-c-text-2);
  line-height: 1.7;
  margin: 0;
}
.faq-item a { color: var(--solarized-cyan); text-decoration: none; }
.faq-item a:hover { text-decoration: underline; }

/* ═══════════════ CTA ═══════════════ */
.cta-section {
  text-align: center;
  padding: 4rem 0 3rem;
  margin-top: 2rem;
}
.cta-section h2 {
  font-size: 2rem;
  background: linear-gradient(135deg, var(--solarized-cyan), var(--solarized-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-top: 0 !important;
}
.section-subtitle {
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
  margin-bottom: 1.5rem;
}
.cta-install {
  margin-bottom: 2rem;
}
.cta-install code {
  display: inline-block;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.95rem;
  color: var(--solarized-cyan);
  letter-spacing: 0.01em;
}
.cta-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.cta-btn {
  display: inline-block;
  padding: 0.85rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}
.cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(42, 161, 152, 0.3);
}
.cta-primary {
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--solarized-cyan);
  color: var(--solarized-cyan);
  font-weight: 700;
}
.cta-secondary {
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-1);
}

/* ═══════════════ FOOTER ═══════════════ */
.site-footer {
  margin-top: 4rem;
  padding: 3rem 0 0;
  border-top: 1px solid var(--vp-c-border);
}
.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2.5rem;
}
.footer-col h4 {
  margin: 0 0 0.75rem !important;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  border: none !important;
  padding: 0 !important;
}
.footer-tagline {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
  margin: 0;
}
.footer-col a {
  display: block;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  text-decoration: none;
  padding: 0.2rem 0;
  transition: color 0.2s;
}
.footer-col a:hover {
  color: var(--solarized-cyan);
}
.footer-bottom {
  border-top: 1px solid var(--vp-c-border);
  padding: 1.5rem 0;
  text-align: center;
}
.footer-bottom p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
}

/* ═══════════════ RESPONSIVE ═══════════════ */
@media (max-width: 768px) {
  .steps-grid { grid-template-columns: 1fr; }
  .security-grid { grid-template-columns: 1fr; }
  .pipeline { flex-direction: column; align-items: center; }
  .pipeline-arrow { transform: rotate(90deg); padding: 0; }
  .eco-grid { grid-template-columns: 1fr; }
  .footer-grid { grid-template-columns: 1fr; }
}
</style>
