---
layout: home
title: JSONExpress — Stack-Agnostic, TypeScript-Native Headless API Framework
description: A rapid JSON to API generator that scales from an instant mock API to a production-grade, swappable database TypeScript backend.

hero:
  name: "JSONExpress"
  text: "JSON → Production"
  tagline: "The definitive stack agnostic backend framework. Instant JSON mock APIs that seamlessly graduate to modular TypeScript backends."
  actions:
    - theme: brand
      text: ⚡ Start Building Now
      link: /guide/getting-started
    - theme: alt
      text: 📖 Read the Architecture
      link: /guide/architecture

features:
  - icon: ⚡
    title: JSON to API Generator
    details: The ultimate JSONPlaceholder alternative with persistence. Drop a JSON file to get a fake REST API with database capabilities instantly.
    link: /guide/json-mode
    linkText: Learn more →
  - icon: 🏗️
    title: Swappable Database Backend
    details: Replace Express with Fastify or migrate MongoDB to PostgreSQL without rewriting a single line of business logic.
    link: /guide/adapters
    linkText: Learn more →
  - icon: 🔓
    title: No Framework Lock-In
    details: A headless CMS without framework lock-in. Consume your stack-agnostic APIs using Vue, SvelteKit, React Native, or vanilla HTML.
    link: /guide/architecture
    linkText: Learn more →
---

## The Prototyping to Production Continuum

The biggest trap in modern software engineering is throwaway code. JSONExpress provides **rapid backend development for frontend developers** without forcing you to abandon your initial work.

<div class="steps-grid">
<div class="step-card">
<div class="step-number">1</div>
<h3>The Instant Mock API</h3>
<p>Frontend teams shouldn't wait weeks. JSONExpress is a <strong>JSONPlaceholder alternative with persistence</strong>. Drop a JSON file to generate a <strong>fake REST API with database</strong> capabilities. Real CRUD, zero config.</p>
</div>
<div class="step-card">
<div class="step-number">2</div>
<h3>TypeScript API Builder</h3>
<p>When you achieve product-market fit, eject from JSON mode. Use our <strong>TypeScript API builder</strong> to enforce strict validation and auto-generate GraphQL resolvers. The fastest path from <strong>idea to MVP to production backend</strong>.</p>
</div>
<div class="step-card">
<div class="step-number">3</div>
<h3>The Replaceable Stack</h3>
<p>Avoid technical debt. Our <strong>swappable database TypeScript backend</strong> lets you seamlessly <strong>replace Express with Fastify</strong> and <strong>migrate MongoDB to PostgreSQL</strong> without rewriting your application's logic.</p>
</div>
</div>



## The Enterprise Extensibility Ecosystem

JSONExpress is more than a schema parser; it is a sprawling, independently installable micro-ecosystem designed to handle every aspect of modern backend engineering.

<div class="eco-grid">
<div class="eco-category">
<h3>🛡️ Security, Auth & Validation</h3>
<p>Our <code>middleware-auth</code> and <code>plugin-identity</code> packages enforce secure Argon2 hashing and JWKS validation. Paired with <code>middleware-validation</code>, your endpoints are strictly typed and defended.</p>
</div>
<div class="eco-category">
<h3>🌐 Transport Layer & Loggers</h3>
<p>Swap your server via our transport layer. Use <code>transport-express</code> or upgrade to <code>transport-fastify</code> for performance. Track requests using <code>logger-pino</code> or <code>logger-console</code>.</p>
</div>
<div class="eco-category">
<h3>⏳ Queues & KV Stores</h3>
<p>Offload heavy processing to distributed workers using <code>queue-bullmq</code> or handle locally via <code>queue-memory</code>. Manage ephemeral caching using our <code>kv-redis</code> and <code>kv-memory</code> stores.</p>
</div>
<div class="eco-category">
<h3>🔧 Docs, Seeders & Email</h3>
<p>Auto-generate OpenAPI specs with <code>docs-swagger</code>. Populate testing databases using <code>seeder-faker</code>, and test outbound communications safely using <code>email-console</code>.</p>
</div>
</div>



## Built For Frontend Teams and Startup Founders

We built JSONExpress specifically for the teams that move the fastest, but get penalized the hardest by traditional backend constraints.

<div class="security-grid">
<div class="security-card">
<div class="security-icon">🏢</div>
<h4>Digital Agencies & Freelancers</h4>
<p>Instantly spin up a <strong>mock API generator typescript</strong> environment. When clients demand specific databases for compliance, use our <strong>TypeScript API builder swappable database</strong> architecture to comply without rewrites.</p>
</div>
<div class="security-card">
<div class="security-icon">🚀</div>
<h4>Startup MVPs & Innovation Teams</h4>
<p>Don't waste runway writing boilerplate CRUD operations. If you are evaluating <strong>Payload CMS vs custom backend</strong> approaches, JSONExpress gives you headless CMS speed with custom backend freedom.</p>
</div>
</div>



## Omnichannel Protocol Delivery

JSONExpress operates as a multi-protocol engine. Today, it functions as a seamless **REST to GraphQL backend generator**, instantly compiling your schema into predictable REST routes and optimized GraphQL Graphs. Tomorrow, the exact same schema can expose data over **gRPC, tRPC, or WebSockets**—eliminating the need to rewrite resolvers or database queries.



## A Headless CMS Without Framework Lock-In

The developer experience you deserve, without the bloated GUI, massive dependency trees, and proprietary ecosystems of traditional content managers.

<div class="steps-grid">
<div class="step-card">
<div class="step-number">🔓</div>
<h3>True Infrastructure Agnosticism</h3>
<p>Unlike platforms that trap you in Next.js, JSONExpress is a <strong>headless CMS without framework lock-in</strong>. Consume your <strong>stack agnostic backend framework</strong> APIs using Vue, SvelteKit, React Native, or vanilla HTML.</p>
</div>
<div class="step-card">
<div class="step-number">🛠️</div>
<h3>The Open-Source Alternative</h3>
<p>A lightweight, <strong>Strapi alternative stack agnostic</strong> solution. Built as a <strong>TypeScript headless CMS</strong>, offering compile-time safety and intellisense without the 1500+ dependency bloat found in alternatives.</p>
</div>
<div class="step-card">
<div class="step-number">🌍</div>
<h3>Self-Hosted Data Sovereignty</h3>
<p>JSONExpress is a true <strong>Contentful self-hosted alternative</strong>. Deploy your architecture anywhere—from a $5 VPS to a global Kubernetes cluster. Maintain 100% control over your database and infrastructure costs.</p>
</div>
</div>



## Frequently Asked Questions

<details class="faq-item">
<summary>What makes JSONExpress different from other rapid backend tools?</summary>
<p>Most tools are either static mock APIs that cannot hold state, or heavy enterprise systems that require days to configure. JSONExpress is a <strong>headless CMS with replaceable database</strong> architecture. It acts as a <strong>JSON to API generator</strong> on day one, and a highly optimized enterprise server on day one hundred.</p>
</details>

<details class="faq-item">
<summary>How exactly does the swappable database feature work?</summary>
<p>JSONExpress uses the Repository Pattern heavily to decouple your logic from the driver. Your models don't know if they are talking to a JSON file or a SQL database. This means you can literally <strong>migrate MongoDB to PostgreSQL</strong> by changing one string in your configuration.</p>
</details>

<details class="faq-item">
<summary>Is this really a Contentful self-hosted alternative?</summary>
<p>Yes. If you are tired of arbitrary API limits and paying thousands of dollars a month just to deliver JSON payloads to your frontend, JSONExpress provides the same underlying capability (a robust, schema-driven API) entirely under your control, functioning as a powerful <strong>TypeScript headless CMS</strong>.</p>
</details>



<div class="cta-section">
<h2>Start Your Idea to Production Journey</h2>
<p class="section-subtitle">The definitive <strong>rapid backend development from JSON</strong> tool is here.</p>
<div class="cta-install">
<code>npm install @json-express/core @json-express/cli</code>
</div>
<div class="cta-buttons">
<a href="/guide/getting-started" class="cta-btn cta-primary">Read the Documentation</a>
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
