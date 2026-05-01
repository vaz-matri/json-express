---
layout: home
title: JSONExpress — Instant REST & GraphQL API from a JSON File
description: Open-source Node.js meta-framework. Drop a JSON file, get REST + GraphQL in seconds. Swap in Postgres, Fastify, or Auth0 when you're ready. MIT licensed, TypeScript-native. 23 modular packages.

hero:
  name: "JSONExpress"
  text: "Drop a JSON file. Get an API."
  tagline: "Instant REST + GraphQL from a JSON file. Swap in Postgres, Fastify, or Auth0 when you outgrow it — no rewrites, same config. MIT licensed, TypeScript-native."
  actions:
    - theme: brand
      text: ⚡ Get Started in 60 Seconds
      link: /getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/vaz-matri/json-express

features:
  - icon: ⚡
    title: Zero-Config JSON Mode
    details: Drop a JSON file and get a full CRUD REST API in seconds. No schemas, no config, no boilerplate. The fastest path to a running API.
    link: /json-mode
    linkText: Learn more →
  - icon: 🔄
    title: Swap Any Layer
    details: Change your database, HTTP server, or API protocol with one line of config. Express → Fastify, REST → GraphQL, memory → file persistence. Your code never changes.
    link: /adapters
    linkText: Learn more →
  - icon: 🔓
    title: No Framework Lock-In
    details: Not tied to Next.js, Express, or any frontend. Works with Vue, Svelte, React Native, or vanilla HTML. 23 independently installable packages, MIT licensed.
    link: /architecture
    linkText: Learn more →
---

<div class="badge-row">
  <a href="https://github.com/vaz-matri/json-express" target="_blank">
    <img alt="GitHub stars"
      src="https://img.shields.io/github/stars/vaz-matri/json-express?style=flat-square&color=2aa198&label=GitHub%20Stars">
  </a>
  <a href="https://www.npmjs.com/package/@json-express/core" target="_blank">
    <img alt="npm downloads"
      src="https://img.shields.io/npm/dm/@json-express/core?style=flat-square&color=268bd2&label=Monthly%20Downloads">
  </a>
  <img alt="License"
    src="https://img.shields.io/badge/license-MIT-859900?style=flat-square">
  <img alt="TypeScript"
    src="https://img.shields.io/badge/TypeScript-native-2aa198?style=flat-square">
</div>



## The Prototyping to Production Continuum

The biggest trap in backend development is throwaway code — tools that are great on day one but force a rewrite the moment your needs grow. JSONExpress is built around a single idea: **every layer is an explicit, swappable dependency**.

<div class="steps-grid">
<div class="step-card">
<div class="step-number">1</div>
<h3>The Instant Mock API</h3>
<p>Drop a JSON file and get a full CRUD API in seconds. No config, no TypeScript required. Real endpoints, real HTTP — just working.</p>
</div>
<div class="step-card">
<div class="step-number">2</div>
<h3>TypeScript Schema Mode</h3>
<p>When you need types, validation, and field-level security, define a <code>defineModel()</code> schema. REST and GraphQL are generated automatically. Nothing from step 1 changes.</p>
</div>
<div class="step-card">
<div class="step-number">3</div>
<h3>The Replaceable Stack</h3>
<p>Swap <code>adapter-memory</code> for <code>adapter-json</code> for file persistence. Add <code>plugin-identity</code> for full auth. Change one line in your config — your schemas and hooks never touch.</p>
</div>
</div>



## How the Modular Architecture Works

One schema definition. Every layer is independently swappable.

<div class="arch-diagram">
  <div class="arch-layer">
    <div class="arch-label">Your Data</div>
    <div class="arch-boxes">
      <div class="arch-box schema">posts.json <span>or</span> defineModel()</div>
    </div>
  </div>
  <div class="arch-arrow">↓ choose your database</div>
  <div class="arch-layer">
    <div class="arch-label">Adapter Layer</div>
    <div class="arch-boxes">
      <div class="arch-box active">adapter-memory</div>
      <div class="arch-box active">adapter-json</div>
      <div class="arch-box muted">adapter-postgres ↗</div>
      <div class="arch-box muted">adapter-mongo ↗</div>
      <div class="arch-box muted">adapter-sqlite ↗</div>
    </div>
  </div>
  <div class="arch-arrow">↓ choose your protocol</div>
  <div class="arch-layer">
    <div class="arch-label">API Layer</div>
    <div class="arch-boxes">
      <div class="arch-box active">api-rest</div>
      <div class="arch-box active">api-graphql</div>
      <div class="arch-box muted">api-trpc ↗</div>
    </div>
  </div>
  <div class="arch-arrow">↓ choose your server</div>
  <div class="arch-layer">
    <div class="arch-label">Transport Layer</div>
    <div class="arch-boxes">
      <div class="arch-box active">transport-express</div>
      <div class="arch-box active">transport-fastify</div>
      <div class="arch-box muted">transport-h3 ↗</div>
    </div>
  </div>
</div>
<p class="arch-note">
  ↗ on the roadmap &nbsp;|&nbsp;
  Swap any layer by changing one line in your config.
  Your schemas, hooks, and business logic never change.
</p>



## The Ecosystem

23 independently installable packages. Install only what you need.

<div class="eco-grid">
<div class="eco-category">
<h3>🛡️ Security & Auth</h3>
<p><code>plugin-identity</code> gives you register, login, refresh tokens, password reset, and email verification — all from one <code>npm install</code>. Argon2id hashing, JWKS support for Auth0/Firebase/Cognito, anti-enumeration on every endpoint.</p>
</div>
<div class="eco-category">
<h3>🌐 Transport & Servers</h3>
<p>Start with <code>transport-express</code>. Swap to <code>transport-fastify</code> for higher throughput. One config line change — every route, schema, and middleware carries over automatically.</p>
</div>
<div class="eco-category">
<h3>🗄️ Database Adapters</h3>
<p><code>adapter-memory</code> for blazing-fast ephemeral storage (~500K RPS read). <code>adapter-json</code> for file-system persistence with atomic writes. Postgres and MongoDB on the roadmap.</p>
</div>
<div class="eco-category">
<h3>🔧 Docs, Seeders & Logging</h3>
<p>Auto-generate OpenAPI specs with <code>docs-swagger</code>. Populate test databases with <code>seeder-faker</code>. Structured logging via <code>logger-pino</code> with automatic <code>traceId</code> injection.</p>
</div>
</div>



## A Headless CMS Without Framework Lock-In

<div class="steps-grid">
<div class="step-card">
<div class="step-number">🔓</div>
<h3>Not Tied to Next.js</h3>
<p>Payload requires Next.js. JSONExpress works with any frontend — Vue, Svelte, React Native, vanilla HTML, or no frontend at all. Your backend is your backend.</p>
</div>
<div class="step-card">
<div class="step-number">🛠️</div>
<h3>MIT, No Restrictions</h3>
<p>Strapi and Directus have moved some features behind paid plans. JSONExpress is MIT licensed with no revenue caps, no feature gates, and no SaaS upsell.</p>
</div>
<div class="step-card">
<div class="step-number">🌍</div>
<h3>Self-Host Anywhere</h3>
<p>Deploy to a $5 VPS, a Kubernetes cluster, or AWS Amplify. No vendor lock-in, no cloud dependency. You own your data and your infrastructure.</p>
</div>
</div>



## Frequently Asked Questions

<details class="faq-item">
<summary>What makes JSONExpress different from json-server?</summary>
<p>json-server is excellent for a 30-second prototype, but it stops there — no TypeScript schemas, no real authentication, no path to a production database. JSONExpress gives you the same zero-config start, and then lets you add persistence, auth, GraphQL, and real databases without rewriting anything. A <code>db.json</code> file from json-server is already valid input for JSONExpress.</p>
</details>

<details class="faq-item">
<summary>How does the swappable database work?</summary>
<p>Every database adapter implements the same <code>IDatabaseAdapter</code> interface from <code>@json-express/core</code>. Your schemas, hooks, and access control rules are defined against this interface — not against any specific database. Swap the adapter, and everything else carries over. There is no ORM magic, no migration scripts for the schema layer.</p>
</details>

<details class="faq-item">
<summary>Is JSONExpress production-ready?</summary>
<p>It is production-ready for solo developers and small teams who are comfortable managing their own infrastructure. The auth system (<code>plugin-identity</code>) is production-grade — Argon2id, refresh token rotation, JWKS, anti-enumeration. The two available database adapters (memory and JSON file) are suitable for low-to-medium traffic. Postgres and MongoDB adapters are on the roadmap.</p>
</details>



<div class="cta-section">
<h2>Start in 30 Seconds</h2>
<p class="section-subtitle">Install the CLI, drop a JSON file, and you have a running API.</p>
<div class="cta-install">
<code>npm install @json-express/cli</code>
</div>
<div class="cta-buttons">
<a href="/getting-started" class="cta-btn cta-primary">Read the Docs</a>
<a href="https://github.com/vaz-matri/json-express" class="cta-btn cta-secondary">View on GitHub</a>
</div>
</div>

<footer class="site-footer">
<div class="footer-grid">
<div class="footer-col">
<h4>JSONExpress</h4>
<p class="footer-tagline">Open-source Node.js meta-framework. Drop a JSON file, get an API. MIT licensed.</p>
</div>
<div class="footer-col">
<h4>Learn</h4>
<a href="/getting-started">Getting Started</a>
<a href="/json-mode">Zero-Config JSON Mode</a>
<a href="/architecture">Architecture</a>
<a href="/schemas">Schemas & Models</a>
<a href="/hooks">Hooks & Security</a>
</div>
<div class="footer-col">
<h4>Ecosystem</h4>
<a href="/core">Core</a>
<a href="/api-rest">REST Generator</a>
<a href="/api-graphql">GraphQL Generator</a>
<a href="/plugin-identity">Identity Plugin</a>
<a href="/middleware-auth">Auth Middleware</a>
</div>
<div class="footer-col">
<h4>Community</h4>
<a href="https://github.com/vaz-matri/json-express">GitHub</a>
<a href="https://github.com/vaz-matri/json-express/issues">Issues</a>
<a href="https://github.com/vaz-matri/json-express/discussions">Discussions</a>
</div>
</div>
<div class="footer-bottom">
<p>Released under the MIT License. © 2026 JSONExpress Contributors.</p>
</div>
</footer>

<style>
/* ═══════════════ SCOPED LANDING STYLES ═══════════════ */
.VPHome .vp-doc {
  max-width: 1152px !important;
  margin: 0 auto !important;
  padding: 0 24px !important;
}
.VPHome {
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}
.VPHome .vp-doc h2 {
  border-top: none !important;
  margin-top: 4rem;
  padding-top: 0 !important;
}
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

/* ═══════════════ BADGES ═══════════════ */
.badge-row {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin: 1rem 0 2rem;
  flex-wrap: wrap;
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

/* ═══════════════ ARCHITECTURE DIAGRAM ═══════════════ */
.arch-diagram {
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 2rem;
  margin: 1.5rem 0;
}
.arch-layer { margin-bottom: 0.5rem; }
.arch-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
  margin-bottom: 0.5rem;
}
.arch-boxes { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.arch-box {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  padding: 0.4rem 0.8rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.85rem;
}
.arch-box.active {
  border-color: var(--solarized-cyan);
  color: var(--solarized-cyan);
}
.arch-box.muted { opacity: 0.5; }
.arch-box.schema { border-color: var(--solarized-yellow); }
.arch-box span { opacity: 0.5; margin: 0 0.3rem; }
.arch-arrow {
  text-align: center;
  color: var(--vp-c-text-3);
  font-size: 0.9rem;
  padding: 0.5rem 0;
}
.arch-note {
  text-align: center;
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
  margin-top: 1rem;
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
  .eco-grid { grid-template-columns: 1fr; }
  .footer-grid { grid-template-columns: 1fr; }
}
</style>
