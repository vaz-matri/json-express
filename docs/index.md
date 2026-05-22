---
layout: home
title: JSONExpress — Instant REST & GraphQL API from JSON files
description: Open-source Node.js meta-framework. Drop JSON files, get REST + GraphQL in seconds. Swap in Postgres, Fastify, or Auth0 when you're ready. MIT licensed, TypeScript-native. A suite of modular packages.

hero:
  name: "<span style='font-weight:800'>JSON</span><span style='font-weight:600'>Express</span>"
  text: "Drop JSON files. Get APIs."
  tagline: "Stop rewriting your backend. JSONExpress is an Agent-First Node.js framework that generates instant APIs from simple JSON. Orchestrate with AI to scale to production with swappable Postgres adapters, Fastify transports, and built-in Identity management—without changing your code."
  actions:
    - theme: brand
      text: ⚡ Get Started in 60 Seconds
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/vaz-matri/json-express

features:
  - icon: ⚡
    title: Zero-Config JSON Mode
    details: Drop JSON files and get a full CRUD REST API in seconds. No schemas, no config, no boilerplate. The fastest path to a running API.
    link: /guide/json-mode
    linkText: Explore Zero-Config JSON Mode
  - icon: 🔄
    title: Swap Any Layer
    details: Change your database, HTTP server, or API protocol with one line of config. Express → Fastify, REST → GraphQL, memory → file persistence. Your code never changes.
    link: /guide/adapters
    linkText: Compare swappable database adapters
  - icon: 🔓
    title: No Framework Lock-In
    details: Not tied to Next.js, Express, or any frontend. Works with Vue, Svelte, React Native, or vanilla HTML. Independently installable packages, MIT licensed.
    link: /guide/architecture
    linkText: See the modular architecture
  - icon: 🤖
    title: Agent-First Design
    details: Built to be orchestrated by AI. Every official package ships with AI instructions (llms.txt), giving your agent perfectly understood, rock-solid building blocks.
    link: /blog/the-evolution-to-agent-first
    linkText: Read about the Agent-First evolution
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



## The Ecosystem

Every capability ships as its own package — install only what you need, swap it out when your requirements change.

<div class="eco-articles">

<div class="eco-article">
<div class="eco-img">
<svg viewBox="0 0 540 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="JSON file persistence with atomic writes">
  <g transform="translate(370 110)" opacity="0.95">
    <ellipse cx="50" cy="160" rx="56" ry="8" fill="#1f5e57" opacity="0.2"></ellipse>
    <rect x="-4" y="20" width="108" height="130" fill="#2a9d8f"></rect>
    <ellipse cx="50" cy="150" rx="54" ry="14" fill="#2a9d8f"></ellipse>
    <ellipse cx="50" cy="20" rx="54" ry="14" fill="#1f5e57"></ellipse>
    <ellipse cx="50" cy="56" rx="54" ry="14" fill="none" stroke="#1f5e57" stroke-width="2" opacity="0.55"></ellipse>
    <ellipse cx="50" cy="92" rx="54" ry="14" fill="none" stroke="#1f5e57" stroke-width="2" opacity="0.55"></ellipse>
    <circle cx="22" cy="124" r="3" fill="#c8d97a"></circle>
    <circle cx="34" cy="124" r="3" fill="#c8d97a" opacity="0.5"></circle>
  </g>
  <g transform="translate(58 132)">
    <rect x="4" y="6" width="84" height="106" rx="6" fill="#1f5e57" opacity="0.2"></rect>
    <rect width="84" height="106" rx="6" fill="#f5f0e8" opacity="0.85"></rect>
    <path d="M 70 0 L 84 14 L 70 14 Z" fill="#e2dac3"></path>
    <g transform="translate(8 10)">
      <rect width="44" height="14" rx="3" fill="#c8d97a" opacity="0.85"></rect>
      <text x="6" y="10" font-family="ui-monospace,Menlo,monospace" font-size="8" font-weight="700" fill="#2c2924">.db</text>
    </g>
    <rect x="10" y="34" width="50" height="3" rx="1" fill="#1f5e57" opacity="0.55"></rect>
    <rect x="10" y="44" width="64" height="3" rx="1" fill="#1f5e57" opacity="0.55"></rect>
    <rect x="10" y="54" width="40" height="3" rx="1" fill="#1f5e57" opacity="0.55"></rect>
    <rect x="10" y="64" width="58" height="3" rx="1" fill="#1f5e57" opacity="0.55"></rect>
    <rect x="10" y="74" width="46" height="3" rx="1" fill="#1f5e57" opacity="0.55"></rect>
    <rect x="10" y="84" width="62" height="3" rx="1" fill="#1f5e57" opacity="0.55"></rect>
  </g>
  <g>
    <path d="M 150 150 Q 200 100 246 132" fill="none" stroke="#c8d97a" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 6"></path>
    <path d="M 240 126 L 250 132 L 240 138" fill="none" stroke="#c8d97a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
  </g>
  <g transform="translate(180 80)">
    <rect x="6" y="8" width="180" height="220" rx="8" fill="#1f5e57" opacity="0.3"></rect>
    <rect width="180" height="220" rx="8" fill="#f5f0e8"></rect>
    <path d="M 162 0 L 180 18 L 162 18 Z" fill="#e2dac3"></path>
    <g transform="translate(14 14)">
      <rect width="80" height="22" rx="4" fill="#2a9d8f"></rect>
      <text x="8" y="15" font-family="ui-monospace,Menlo,monospace" font-size="10" font-weight="700" fill="#f5f0e8">*.json</text>
    </g>
    <g font-family="ui-monospace,Menlo,monospace">
      <text x="14" y="62" font-size="14" font-weight="700" fill="#2a9d8f">[</text>
      <text x="26" y="80" font-size="11" font-weight="700" fill="#2a9d8f">{</text>
      <rect x="40" y="84" width="36" height="4" rx="1" fill="#2a9d8f"></rect>
      <rect x="80" y="84" width="64" height="4" rx="1" fill="#1f5e57" opacity="0.55"></rect>
      <rect x="40" y="94" width="48" height="4" rx="1" fill="#2a9d8f"></rect>
      <rect x="92" y="94" width="50" height="4" rx="1" fill="#1f5e57" opacity="0.55"></rect>
      <text x="26" y="114" font-size="11" font-weight="700" fill="#2a9d8f">},</text>
      <text x="26" y="132" font-size="11" font-weight="700" fill="#2a9d8f">{</text>
      <rect x="40" y="136" width="40" height="4" rx="1" fill="#2a9d8f"></rect>
      <rect x="84" y="136" width="58" height="4" rx="1" fill="#1f5e57" opacity="0.55"></rect>
      <rect x="40" y="146" width="32" height="4" rx="1" fill="#2a9d8f"></rect>
      <rect x="76" y="146" width="64" height="4" rx="1" fill="#1f5e57" opacity="0.55"></rect>
      <text x="26" y="166" font-size="11" font-weight="700" fill="#2a9d8f">},</text>
      <rect x="40" y="180" width="6" height="6" rx="3" fill="#2a9d8f" opacity="0.5"></rect>
      <rect x="50" y="180" width="6" height="6" rx="3" fill="#2a9d8f" opacity="0.5"></rect>
      <rect x="60" y="180" width="6" height="6" rx="3" fill="#2a9d8f" opacity="0.5"></rect>
      <text x="14" y="206" font-size="14" font-weight="700" fill="#2a9d8f">]</text>
    </g>
  </g>
  <g transform="translate(348 264)">
    <circle r="28" fill="#c8d97a"></circle>
    <path d="M 0 -14 L 12 -8 L 12 2 Q 12 12 0 16 Q -12 12 -12 2 L -12 -8 Z" fill="#1f5e57"></path>
    <path d="M -6 0 L -1 5 L 7 -5" fill="none" stroke="#c8d97a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path>
  </g>
</svg>
</div>
<div class="eco-content">
<p>Persisting data doesn't always mean running a database. Covering how to store your collections as JSON files with atomic writes — so a crash mid-write never corrupts your data — when file-system persistence is the right choice, and how to graduate to a relational database without changing any application code.</p>
<a href="/guide/adapters" class="eco-read-more">Read more →</a>
</div>
</div>

<div class="eco-article">
<div class="eco-img">
<svg viewBox="0 0 540 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Fastify throughput illustration">
  <g>
    <rect x="18" y="60" width="20" height="6" rx="2" fill="#c8d97a" opacity="0.55"></rect>
    <rect x="46" y="60" width="14" height="6" rx="2" fill="#c8d97a" opacity="0.7"></rect>
    <rect x="68" y="60" width="22" height="6" rx="2" fill="#c8d97a" opacity="0.85"></rect>
    <rect x="98" y="60" width="16" height="6" rx="2" fill="#c8d97a"></rect>
    <rect x="14" y="90" width="14" height="6" rx="2" fill="#2a9d8f" opacity="0.45"></rect>
    <rect x="36" y="90" width="20" height="6" rx="2" fill="#2a9d8f" opacity="0.65"></rect>
    <rect x="64" y="90" width="14" height="6" rx="2" fill="#2a9d8f" opacity="0.85"></rect>
    <rect x="86" y="90" width="22" height="6" rx="2" fill="#2a9d8f"></rect>
  </g>
  <g transform="translate(140 150)">
    <circle cx="6" cy="8" r="86" fill="#1f5e57" opacity="0.2"></circle>
    <circle r="86" fill="#1f5e57"></circle>
    <circle r="74" fill="#2a9d8f"></circle>
    <path d="M -56 30 A 64 64 0 1 1 56 30" fill="none" stroke="#1f5e57" stroke-width="10" stroke-linecap="round" opacity="0.55"></path>
    <path d="M -56 30 A 64 64 0 1 1 60 -22" fill="none" stroke="#c8d97a" stroke-width="10" stroke-linecap="round"></path>
    <g stroke="#f5f0e8" stroke-width="2" stroke-linecap="round" opacity="0.65">
      <line x1="-58" y1="20" x2="-50" y2="14"></line>
      <line x1="-50" y1="-14" x2="-42" y2="-10"></line>
      <line x1="-30" y1="-40" x2="-26" y2="-32"></line>
      <line x1="0" y1="-50" x2="0" y2="-42"></line>
      <line x1="30" y1="-40" x2="26" y2="-32"></line>
      <line x1="50" y1="-14" x2="42" y2="-10"></line>
      <line x1="58" y1="20" x2="50" y2="14"></line>
    </g>
    <g transform="rotate(60)">
      <path d="M -3 6 L 3 6 L 1 -54 L -1 -54 Z" fill="#c8d97a"></path>
    </g>
    <circle r="8" fill="#1f5e57"></circle>
    <circle r="3" fill="#c8d97a"></circle>
    <g transform="translate(0 50)">
      <rect x="-44" y="-12" width="88" height="22" rx="11" fill="#c8d97a"></rect>
      <text x="0" y="3" font-family="ui-monospace,Menlo,monospace" font-size="10" font-weight="700" fill="#2c2924" text-anchor="middle">req / sec</text>
    </g>
  </g>
  <g transform="translate(266 90)">
    <rect width="46" height="14" rx="3" fill="#1f5e57"></rect>
    <text x="6" y="10" font-family="ui-monospace,Menlo,monospace" font-size="8" font-weight="700" fill="#c8d97a">BEFORE</text>
    <rect x="56" y="0" width="80" height="14" rx="3" fill="#2a9d8f" opacity="0.55"></rect>
    <rect x="56" y="0" width="80" height="14" rx="3" fill="none" stroke="#2a9d8f" stroke-width="1" opacity="0.4"></rect>
    <rect x="138" y="-2" width="2" height="18" rx="1" fill="#1f5e57" opacity="0.4"></rect>
    <g transform="translate(0 30)">
      <rect width="46" height="14" rx="3" fill="#c8d97a"></rect>
      <text x="11" y="10" font-family="ui-monospace,Menlo,monospace" font-size="8" font-weight="700" fill="#2c2924">AFTER</text>
      <rect x="56" y="0" width="220" height="14" rx="3" fill="#2a9d8f"></rect>
      <rect x="220" y="3" width="14" height="2" rx="1" fill="#f5f0e8" opacity="0.7"></rect>
      <rect x="240" y="3" width="22" height="2" rx="1" fill="#f5f0e8" opacity="0.55"></rect>
      <rect x="220" y="9" width="22" height="2" rx="1" fill="#f5f0e8" opacity="0.55"></rect>
      <rect x="248" y="9" width="14" height="2" rx="1" fill="#f5f0e8" opacity="0.7"></rect>
    </g>
    <g transform="translate(244 60)">
      <rect x="-22" y="-12" width="44" height="22" rx="11" fill="#c8d97a"></rect>
      <text x="0" y="3" font-family="ui-monospace,Menlo,monospace" font-size="11" font-weight="700" fill="#2c2924" text-anchor="middle">2.7×</text>
    </g>
  </g>
  <g transform="translate(266 196)">
    <rect x="6" y="8" width="232" height="84" rx="6" fill="#1f5e57" opacity="0.25"></rect>
    <rect width="232" height="84" rx="6" fill="#1f5e57"></rect>
    <rect width="232" height="22" rx="6" fill="#163f3a"></rect>
    <rect y="14" width="232" height="8" fill="#163f3a"></rect>
    <circle cx="12" cy="11" r="3" fill="#c8d97a"></circle>
    <circle cx="22" cy="11" r="3" fill="#f5f0e8" opacity="0.4"></circle>
    <circle cx="32" cy="11" r="3" fill="#f5f0e8" opacity="0.25"></circle>
    <rect x="92" y="8" width="60" height="6" rx="2" fill="#f5f0e8" opacity="0.4"></rect>
    <g font-family="ui-monospace,Menlo,monospace">
      <g opacity="0.55">
        <rect x="14" y="36" width="200" height="10" rx="2" fill="#d97560" opacity="0.18"></rect>
        <text x="20" y="44" font-size="10" fill="#d97560" text-decoration="line-through">- adapter: &#39;express&#39;</text>
      </g>
      <g>
        <rect x="14" y="52" width="200" height="10" rx="2" fill="#c8d97a" opacity="0.22"></rect>
        <text x="20" y="60" font-size="10" font-weight="700" fill="#c8d97a">+ adapter: &#39;fastify&#39;</text>
      </g>
      <text x="14" y="74" font-size="9" fill="#f5f0e8" opacity="0.55">// every route, schema, middleware preserved</text>
    </g>
  </g>
  <g transform="translate(82 102)">
    <path d="M 0 -16 L -10 4 L -2 4 L -8 22 L 12 -2 L 2 -2 L 8 -16 Z" fill="#c8d97a"></path>
  </g>
</svg>
</div>
<div class="eco-content">
<p>The HTTP server is the innermost performance constraint in any API. Covering how to replace Express with Fastify's low-overhead request lifecycle, what throughput gains to expect in practice, and how a single config change migrates every route, schema, and middleware automatically without touching a line of application code.</p>
<a href="/packages/transport-fastify" class="eco-read-more">Read more →</a>
</div>
</div>

<div class="eco-article">
<div class="eco-img">
<svg viewBox="0 0 540 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="GraphQL and REST from one model">
  <g transform="translate(210 28)">
    <rect x="6" y="8" width="120" height="60" rx="8" fill="#1f5e57" opacity="0.25"></rect>
    <rect width="120" height="60" rx="8" fill="#2a9d8f"></rect>
    <rect x="14" y="14" width="92" height="6" rx="2" fill="#c8d97a"></rect>
    <rect x="14" y="26" width="64" height="4" rx="1" fill="#f5f0e8" opacity="0.85"></rect>
    <rect x="14" y="34" width="80" height="4" rx="1" fill="#f5f0e8" opacity="0.6"></rect>
    <rect x="14" y="42" width="50" height="4" rx="1" fill="#f5f0e8" opacity="0.85"></rect>
    <rect x="14" y="50" width="72" height="4" rx="1" fill="#f5f0e8" opacity="0.6"></rect>
    <text x="100" y="55" font-family="ui-monospace,Menlo,monospace" font-size="14" font-weight="700" fill="#c8d97a">{ }</text>
  </g>
  <path d="M 240 100 Q 200 130 140 138" fill="none" stroke="#2a9d8f" stroke-width="2.4" stroke-dasharray="2 6" stroke-linecap="round" opacity="0.6"></path>
  <path d="M 300 100 Q 340 130 400 138" fill="none" stroke="#c8d97a" stroke-width="2.4" stroke-dasharray="2 6" stroke-linecap="round" opacity="0.85"></path>
  <g transform="translate(40 130)">
    <rect x="6" y="8" width="200" height="160" rx="8" fill="#1f5e57" opacity="0.25"></rect>
    <rect width="200" height="160" rx="8" fill="#f5f0e8"></rect>
    <g transform="translate(14 14)">
      <rect width="58" height="20" rx="4" fill="#2a9d8f"></rect>
      <text x="10" y="14" font-family="ui-monospace,Menlo,monospace" font-size="11" font-weight="700" fill="#f5f0e8">REST</text>
    </g>
    <rect x="80" y="20" width="60" height="6" rx="2" fill="#1f5e57" opacity="0.25"></rect>
    <g transform="translate(14 50)">
      <rect width="40" height="16" rx="3" fill="#c8d97a"></rect>
      <text x="6" y="11" font-family="ui-monospace,Menlo,monospace" font-size="8" font-weight="700" fill="#2c2924">GET</text>
      <rect x="50" y="4" width="120" height="4" rx="1" fill="#1f5e57" opacity="0.75"></rect>
      <rect x="50" y="11" width="80" height="3" rx="1" fill="#1f5e57" opacity="0.4"></rect>
    </g>
    <g transform="translate(14 74)">
      <rect width="40" height="16" rx="3" fill="#1f5e57"></rect>
      <text x="5" y="11" font-family="ui-monospace,Menlo,monospace" font-size="8" font-weight="700" fill="#c8d97a">POST</text>
      <rect x="50" y="4" width="100" height="4" rx="1" fill="#1f5e57" opacity="0.75"></rect>
      <rect x="50" y="11" width="120" height="3" rx="1" fill="#1f5e57" opacity="0.4"></rect>
    </g>
    <g transform="translate(14 98)">
      <rect width="40" height="16" rx="3" fill="#c8d97a" opacity="0.7"></rect>
      <text x="9" y="11" font-family="ui-monospace,Menlo,monospace" font-size="8" font-weight="700" fill="#2c2924">PUT</text>
      <rect x="50" y="4" width="130" height="4" rx="1" fill="#1f5e57" opacity="0.75"></rect>
      <rect x="50" y="11" width="70" height="3" rx="1" fill="#1f5e57" opacity="0.4"></rect>
    </g>
    <g transform="translate(14 122)">
      <rect width="40" height="16" rx="3" fill="#1f5e57"></rect>
      <text x="3" y="11" font-family="ui-monospace,Menlo,monospace" font-size="8" font-weight="700" fill="#c8d97a">DEL</text>
      <rect x="50" y="4" width="110" height="4" rx="1" fill="#1f5e57" opacity="0.75"></rect>
      <rect x="50" y="11" width="90" height="3" rx="1" fill="#1f5e57" opacity="0.4"></rect>
    </g>
  </g>
  <g transform="translate(300 130)">
    <rect x="6" y="8" width="200" height="160" rx="8" fill="#1f5e57" opacity="0.25"></rect>
    <rect width="200" height="160" rx="8" fill="#1f5e57"></rect>
    <g transform="translate(14 14)">
      <rect width="80" height="20" rx="4" fill="#c8d97a"></rect>
      <text x="8" y="14" font-family="ui-monospace,Menlo,monospace" font-size="10" font-weight="700" fill="#2c2924">GraphQL</text>
    </g>
    <rect x="104" y="20" width="60" height="6" rx="2" fill="#f5f0e8" opacity="0.3"></rect>
    <g font-family="ui-monospace,Menlo,monospace">
      <text x="14" y="58" font-size="13" font-weight="700" fill="#c8d97a">query {</text>
      <rect x="32" y="64" width="60" height="4" rx="1" fill="#c8d97a"></rect>
      <rect x="96" y="64" width="80" height="4" rx="1" fill="#f5f0e8" opacity="0.55"></rect>
      <text x="32" y="82" font-size="11" fill="#c8d97a">{</text>
      <rect x="46" y="88" width="42" height="4" rx="1" fill="#f5f0e8" opacity="0.85"></rect>
      <rect x="46" y="98" width="56" height="4" rx="1" fill="#f5f0e8" opacity="0.85"></rect>
      <rect x="46" y="108" width="36" height="4" rx="1" fill="#f5f0e8" opacity="0.85"></rect>
      <rect x="46" y="118" width="64" height="4" rx="1" fill="#f5f0e8" opacity="0.65"></rect>
      <text x="32" y="136" font-size="11" fill="#c8d97a">}</text>
      <text x="14" y="148" font-size="13" font-weight="700" fill="#c8d97a">}</text>
    </g>
  </g>
  <g transform="translate(270 116)">
    <rect x="-44" y="-10" width="88" height="20" rx="10" fill="#c8d97a"></rect>
    <text x="0" y="4" font-family="ui-monospace,Menlo,monospace" font-size="9" font-weight="700" fill="#2c2924" text-anchor="middle">one model</text>
  </g>
</svg>
</div>
<div class="eco-content">
<p>GraphQL and REST serve different clients well, and you shouldn't have to choose between them. Covering how to generate a complete GraphQL schema from your existing model definitions, expose it alongside your REST endpoints, and inherit all your hooks, access rules, and validation — with no separate schema to write or maintain.</p>
<a href="/packages/api-graphql" class="eco-read-more">Read more →</a>
</div>
</div>

<div class="eco-article">
<div class="eco-img">
<svg viewBox="0 0 540 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Zod input validation illustration">
  <g transform="translate(270 30)">
    <rect x="-72" y="-14" width="144" height="28" rx="14" fill="#c8d97a"></rect>
    <text x="0" y="4" font-family="ui-monospace,Menlo,monospace" font-size="11" font-weight="700" fill="#2c2924" text-anchor="middle">derived from model</text>
    <path d="M 0 14 L 0 28 M -5 23 L 0 30 L 5 23" fill="none" stroke="#c8d97a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path>
  </g>
  <g transform="translate(28 100)">
    <rect x="6" y="8" width="120" height="160" rx="6" fill="#1f5e57" opacity="0.25"></rect>
    <rect width="120" height="160" rx="6" fill="#f5f0e8"></rect>
    <path d="M 104 0 L 120 16 L 104 16 Z" fill="#e2dac3"></path>
    <g transform="translate(10 12)">
      <rect width="56" height="16" rx="3" fill="#2a9d8f"></rect>
      <text x="6" y="11" font-family="ui-monospace,Menlo,monospace" font-size="9" font-weight="700" fill="#f5f0e8">POST</text>
    </g>
    <g font-family="ui-monospace,Menlo,monospace">
      <text x="10" y="46" font-size="11" font-weight="700" fill="#2a9d8f">{</text>
      <rect x="22" y="54" width="36" height="3" rx="1" fill="#2a9d8f"></rect>
      <rect x="62" y="54" width="44" height="3" rx="1" fill="#1f5e57" opacity="0.55"></rect>
      <rect x="22" y="68" width="42" height="3" rx="1" fill="#2a9d8f"></rect>
      <rect x="68" y="68" width="38" height="3" rx="1" fill="#1f5e57" opacity="0.55"></rect>
      <rect x="22" y="82" width="30" height="3" rx="1" fill="#2a9d8f"></rect>
      <rect x="56" y="82" width="50" height="3" rx="1" fill="#1f5e57" opacity="0.55"></rect>
      <rect x="22" y="96" width="40" height="3" rx="1" fill="#2a9d8f"></rect>
      <rect x="66" y="96" width="40" height="3" rx="1" fill="#1f5e57" opacity="0.55"></rect>
      <rect x="22" y="110" width="34" height="3" rx="1" fill="#2a9d8f"></rect>
      <rect x="60" y="110" width="46" height="3" rx="1" fill="#1f5e57" opacity="0.55"></rect>
      <text x="10" y="138" font-size="11" font-weight="700" fill="#2a9d8f">}</text>
    </g>
  </g>
  <g transform="translate(160 178)">
    <path d="M 0 0 L 30 0" stroke="#2a9d8f" stroke-width="2.6" stroke-linecap="round"></path>
    <path d="M 26 -5 L 34 0 L 26 5" stroke="#2a9d8f" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"></path>
  </g>
  <g transform="translate(204 80)">
    <rect x="6" y="8" width="200" height="200" rx="8" fill="#1f5e57" opacity="0.3"></rect>
    <rect width="200" height="200" rx="8" fill="#1f5e57"></rect>
    <rect width="200" height="28" rx="8" fill="#163f3a"></rect>
    <rect y="20" width="200" height="8" fill="#163f3a"></rect>
    <g transform="translate(12 8)">
      <rect width="62" height="14" rx="3" fill="#c8d97a"></rect>
      <text x="6" y="10" font-family="ui-monospace,Menlo,monospace" font-size="9" font-weight="700" fill="#2c2924">z.object</text>
    </g>
    <rect x="84" y="12" width="60" height="6" rx="2" fill="#f5f0e8" opacity="0.4"></rect>
    <g transform="translate(12 48)">
      <circle cx="8" cy="8" r="8" fill="#c8d97a"></circle>
      <path d="M 4 8 L 7 11 L 13 5" fill="none" stroke="#2c2924" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
      <rect x="22" y="2" width="48" height="4" rx="1" fill="#c8d97a"></rect>
      <rect x="74" y="2" width="44" height="4" rx="1" fill="#f5f0e8" opacity="0.55"></rect>
      <rect x="22" y="11" width="100" height="3" rx="1" fill="#f5f0e8" opacity="0.4"></rect>
    </g>
    <g transform="translate(12 72)">
      <circle cx="8" cy="8" r="8" fill="#c8d97a"></circle>
      <path d="M 4 8 L 7 11 L 13 5" fill="none" stroke="#2c2924" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
      <rect x="22" y="2" width="38" height="4" rx="1" fill="#c8d97a"></rect>
      <rect x="64" y="2" width="58" height="4" rx="1" fill="#f5f0e8" opacity="0.55"></rect>
      <rect x="22" y="11" width="80" height="3" rx="1" fill="#f5f0e8" opacity="0.4"></rect>
    </g>
    <g transform="translate(0 96)">
      <rect width="200" height="22" fill="#d97560" opacity="0.18"></rect>
      <g transform="translate(12 4)">
        <circle cx="8" cy="8" r="8" fill="#d97560"></circle>
        <path d="M 5 5 L 11 11 M 11 5 L 5 11" stroke="#f5f0e8" stroke-width="1.8" stroke-linecap="round"></path>
        <rect x="22" y="2" width="44" height="4" rx="1" fill="#d97560"></rect>
        <rect x="70" y="2" width="38" height="4" rx="1" fill="#f5f0e8" opacity="0.7"></rect>
        <rect x="22" y="11" width="120" height="3" rx="1" fill="#d97560" opacity="0.6"></rect>
      </g>
    </g>
    <g transform="translate(12 124)">
      <circle cx="8" cy="8" r="8" fill="#c8d97a"></circle>
      <path d="M 4 8 L 7 11 L 13 5" fill="none" stroke="#2c2924" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
      <rect x="22" y="2" width="50" height="4" rx="1" fill="#c8d97a"></rect>
      <rect x="76" y="2" width="44" height="4" rx="1" fill="#f5f0e8" opacity="0.55"></rect>
      <rect x="22" y="11" width="90" height="3" rx="1" fill="#f5f0e8" opacity="0.4"></rect>
    </g>
    <g transform="translate(12 148)">
      <circle cx="8" cy="8" r="8" fill="#c8d97a"></circle>
      <path d="M 4 8 L 7 11 L 13 5" fill="none" stroke="#2c2924" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
      <rect x="22" y="2" width="40" height="4" rx="1" fill="#c8d97a"></rect>
      <rect x="66" y="2" width="56" height="4" rx="1" fill="#f5f0e8" opacity="0.55"></rect>
      <rect x="22" y="11" width="76" height="3" rx="1" fill="#f5f0e8" opacity="0.4"></rect>
    </g>
    <rect x="12" y="174" width="60" height="14" rx="3" fill="#d97560"></rect>
    <text x="42" y="184" font-family="ui-monospace,Menlo,monospace" font-size="9" font-weight="700" fill="#f5f0e8" text-anchor="middle">1 invalid</text>
    <rect x="80" y="174" width="60" height="14" rx="3" fill="#c8d97a"></rect>
    <text x="110" y="184" font-family="ui-monospace,Menlo,monospace" font-size="9" font-weight="700" fill="#2c2924" text-anchor="middle">4 valid</text>
  </g>
  <g transform="translate(412 178)">
    <path d="M 0 0 L 30 0" stroke="#d97560" stroke-width="2.6" stroke-linecap="round"></path>
    <path d="M 26 -5 L 34 0 L 26 5" stroke="#d97560" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"></path>
  </g>
  <g transform="translate(454 110)">
    <rect x="6" y="8" width="80" height="140" rx="6" fill="#1f5e57" opacity="0.25"></rect>
    <rect width="80" height="140" rx="6" fill="#f5f0e8"></rect>
    <rect width="80" height="22" rx="6" fill="#d97560"></rect>
    <rect y="14" width="80" height="8" fill="#d97560"></rect>
    <text x="40" y="14" font-family="ui-monospace,Menlo,monospace" font-size="11" font-weight="700" fill="#f5f0e8" text-anchor="middle">422</text>
    <g font-family="ui-monospace,Menlo,monospace">
      <text x="6" y="40" font-size="9" font-weight="700" fill="#d97560">errors:</text>
      <rect x="6" y="48" width="68" height="3" rx="1" fill="#d97560"></rect>
      <rect x="6" y="56" width="56" height="3" rx="1" fill="#1f5e57" opacity="0.7"></rect>
      <rect x="6" y="64" width="64" height="3" rx="1" fill="#1f5e57" opacity="0.55"></rect>
      <text x="6" y="84" font-size="8" fill="#1f5e57" opacity="0.7">path:</text>
      <rect x="6" y="88" width="50" height="3" rx="1" fill="#2a9d8f"></rect>
      <text x="6" y="106" font-size="8" fill="#1f5e57" opacity="0.7">code:</text>
      <rect x="6" y="110" width="40" height="3" rx="1" fill="#2a9d8f"></rect>
      <text x="6" y="128" font-size="8" fill="#1f5e57" opacity="0.7">msg:</text>
      <rect x="6" y="132" width="64" height="3" rx="1" fill="#1f5e57" opacity="0.6"></rect>
    </g>
  </g>
</svg>
</div>
<div class="eco-content">
<p>Input validation is the first line of defence against malformed data reaching your business logic. Covering how to derive Zod schemas directly from your model's field definitions, validate every incoming write automatically, and return structured 422 errors with field-level detail — define your data shape once and get validation everywhere.</p>
<a href="/packages/middleware-validation" class="eco-read-more">Read more →</a>
</div>
</div>

<div class="eco-article">
<div class="eco-img">
<svg viewBox="0 0 540 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Authentication illustration — credential stack">
  <g transform="translate(120 76) rotate(-9)">
    <rect width="280" height="160" rx="14" fill="#c8d97a" opacity="0.55"></rect>
  </g>
  <g transform="translate(140 92) rotate(-4)">
    <rect width="280" height="160" rx="14" fill="#2a9d8f" opacity="0.45"></rect>
  </g>
  <g transform="translate(150 100)">
    <rect width="280" height="160" rx="14" fill="#2a9d8f"></rect>
    <rect x="20" y="22" width="60" height="74" rx="6" fill="#1f5e57"></rect>
    <circle cx="50" cy="48" r="11" fill="#c8d97a"></circle>
    <path d="M 30 86 Q 30 70 50 70 Q 70 70 70 86 Z" fill="#c8d97a"></path>
    <rect x="100" y="28" width="140" height="10" rx="3" fill="#f5f0e8"></rect>
    <rect x="100" y="46" width="100" height="6" rx="2" fill="#f5f0e8" opacity="0.6"></rect>
    <rect x="100" y="58" width="120" height="6" rx="2" fill="#f5f0e8" opacity="0.6"></rect>
    <rect x="100" y="76" width="80" height="6" rx="2" fill="#f5f0e8" opacity="0.4"></rect>
    <rect x="20" y="114" width="36" height="28" rx="4" fill="#c8d97a"></rect>
    <line x1="38" y1="114" x2="38" y2="142" stroke="#2a9d8f" stroke-width="1.5"></line>
    <line x1="20" y1="128" x2="56" y2="128" stroke="#2a9d8f" stroke-width="1.5"></line>
    <rect x="68" y="120" width="180" height="8" rx="2" fill="#f5f0e8" opacity="0.5"></rect>
    <rect x="68" y="132" width="120" height="8" rx="2" fill="#f5f0e8" opacity="0.3"></rect>
  </g>
  <g transform="translate(360 60) rotate(28)">
    <circle r="24" fill="none" stroke="#1f5e57" stroke-width="8"></circle>
    <rect x="20" y="-5" width="78" height="10" rx="2" fill="#1f5e57"></rect>
    <rect x="70" y="5" width="9" height="10" fill="#1f5e57"></rect>
    <rect x="85" y="5" width="9" height="15" fill="#1f5e57"></rect>
  </g>
  <g transform="translate(400 244)">
    <circle r="28" fill="#c8d97a"></circle>
    <path d="M -10 0 L -3 8 L 11 -8" fill="none" stroke="#2c2924" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"></path>
  </g>
</svg>
</div>
<div class="eco-content">
<p>Authentication is one of the most common reasons a backend project grows beyond a prototype. Covering how to add register, login, refresh-token rotation, password reset, and email verification to your API — backed by Argon2id password hashing, anti-enumeration on every endpoint, and JWKS support for Auth0, Firebase, and Cognito.</p>
<a href="/packages/plugin-identity" class="eco-read-more">Read more →</a>
</div>
</div>

<div class="eco-article">
<div class="eco-img">
<svg viewBox="0 0 540 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="OpenAPI spec illustration">
  <g transform="translate(120 70) rotate(-9)">
    <rect width="260" height="180" rx="10" fill="#c8d97a" opacity="0.55"></rect>
  </g>
  <g transform="translate(140 86) rotate(-4)">
    <rect width="260" height="180" rx="10" fill="#2a9d8f" opacity="0.45"></rect>
  </g>
  <g transform="translate(150 96)">
    <rect width="280" height="180" rx="10" fill="#2a9d8f"></rect>
    <rect x="0" y="0" width="280" height="32" rx="10" fill="#1f5e57"></rect>
    <rect x="0" y="22" width="280" height="10" fill="#1f5e57"></rect>
    <circle cx="14" cy="16" r="3.5" fill="#c8d97a" opacity="0.9"></circle>
    <circle cx="26" cy="16" r="3.5" fill="#f5f0e8" opacity="0.55"></circle>
    <circle cx="38" cy="16" r="3.5" fill="#f5f0e8" opacity="0.35"></circle>
    <rect x="120" y="12" width="80" height="8" rx="2" fill="#f5f0e8" opacity="0.7"></rect>
    <g transform="translate(16 50)">
      <rect width="46" height="20" rx="4" fill="#c8d97a"></rect>
      <rect x="8" y="6" width="30" height="3" rx="1" fill="#2c2924"></rect>
      <rect x="8" y="12" width="20" height="3" rx="1" fill="#2c2924" opacity="0.55"></rect>
      <rect x="56" y="4" width="180" height="6" rx="2" fill="#f5f0e8"></rect>
      <rect x="56" y="14" width="120" height="4" rx="2" fill="#f5f0e8" opacity="0.45"></rect>
    </g>
    <g transform="translate(16 78)">
      <rect width="46" height="20" rx="4" fill="#1f5e57"></rect>
      <rect x="8" y="6" width="30" height="3" rx="1" fill="#c8d97a"></rect>
      <rect x="8" y="12" width="20" height="3" rx="1" fill="#c8d97a" opacity="0.6"></rect>
      <rect x="56" y="4" width="150" height="6" rx="2" fill="#f5f0e8"></rect>
      <rect x="56" y="14" width="160" height="4" rx="2" fill="#f5f0e8" opacity="0.45"></rect>
    </g>
    <g transform="translate(16 106)">
      <rect width="46" height="20" rx="4" fill="#c8d97a" opacity="0.7"></rect>
      <rect x="8" y="6" width="30" height="3" rx="1" fill="#2c2924"></rect>
      <rect x="8" y="12" width="20" height="3" rx="1" fill="#2c2924" opacity="0.55"></rect>
      <rect x="56" y="4" width="200" height="6" rx="2" fill="#f5f0e8"></rect>
      <rect x="56" y="14" width="100" height="4" rx="2" fill="#f5f0e8" opacity="0.45"></rect>
    </g>
    <g transform="translate(16 134)">
      <rect width="46" height="20" rx="4" fill="#1f5e57"></rect>
      <rect x="8" y="6" width="30" height="3" rx="1" fill="#c8d97a"></rect>
      <rect x="8" y="12" width="20" height="3" rx="1" fill="#c8d97a" opacity="0.6"></rect>
      <rect x="56" y="4" width="170" height="6" rx="2" fill="#f5f0e8"></rect>
      <rect x="56" y="14" width="140" height="4" rx="2" fill="#f5f0e8" opacity="0.45"></rect>
    </g>
    <rect x="16" y="160" width="100" height="6" rx="2" fill="#f5f0e8" opacity="0.4"></rect>
    <rect x="120" y="160" width="40" height="6" rx="2" fill="#c8d97a" opacity="0.7"></rect>
  </g>
</svg>
</div>
<div class="eco-content">
<p>API documentation that goes stale is worse than no documentation at all. Covering how to generate a complete OpenAPI 3.0 spec directly from your model definitions at boot time — no annotations to write, no spec files to maintain — and mount a live Swagger UI that stays automatically in sync as your schemas evolve.</p>
<a href="/packages/docs-swagger" class="eco-read-more">Read more →</a>
</div>
</div>

<div class="eco-article">
<div class="eco-img">
<svg viewBox="0 0 540 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Seed fake data illustration">
  <g transform="translate(28 36)">
    <rect x="6" y="8" width="200" height="64" rx="6" fill="#1f5e57" opacity="0.25"></rect>
    <rect width="200" height="64" rx="6" fill="#1f5e57"></rect>
    <rect width="200" height="20" rx="6" fill="#163f3a"></rect>
    <rect y="12" width="200" height="8" fill="#163f3a"></rect>
    <circle cx="10" cy="10" r="3" fill="#c8d97a"></circle>
    <circle cx="20" cy="10" r="3" fill="#f5f0e8" opacity="0.4"></circle>
    <circle cx="30" cy="10" r="3" fill="#f5f0e8" opacity="0.25"></circle>
    <g font-family="ui-monospace,Menlo,monospace">
      <text x="10" y="38" font-size="11" fill="#c8d97a">$</text>
      <text x="22" y="38" font-size="11" fill="#f5f0e8">cli db </text>
      <text x="74" y="38" font-size="11" font-weight="700" fill="#c8d97a">seed</text>
      <rect x="10" y="46" width="180" height="12" rx="2" fill="#c8d97a" opacity="0.18"></rect>
      <text x="14" y="55" font-size="10" font-weight="700" fill="#c8d97a">--rows 200 --seed 42</text>
    </g>
  </g>
  <g transform="translate(140 110)">
    <path d="M 0 0 L 0 30" stroke="#c8d97a" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="2 5"></path>
    <path d="M -5 26 L 0 34 L 5 26" fill="none" stroke="#c8d97a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"></path>
  </g>
  <g transform="translate(50 156)">
    <rect x="6" y="8" width="380" height="142" rx="8" fill="#1f5e57" opacity="0.3"></rect>
    <rect width="380" height="142" rx="8" fill="#f5f0e8"></rect>
    <rect width="380" height="22" rx="8" fill="#2a9d8f"></rect>
    <rect y="14" width="380" height="8" fill="#2a9d8f"></rect>
    <g font-family="ui-monospace,Menlo,monospace" fill="#f5f0e8" font-size="9" font-weight="700">
      <text x="56" y="14">name</text>
      <text x="158" y="14">email</text>
      <text x="248" y="14">created_at</text>
      <text x="324" y="14">uuid</text>
    </g>
    <g transform="translate(0 30)">
      <rect width="380" height="22" fill="#f5f0e8"></rect>
      <circle cx="22" cy="11" r="8" fill="#c8d97a"></circle>
      <text x="22" y="14" font-family="ui-monospace,Menlo,monospace" font-size="9" font-weight="700" fill="#2c2924" text-anchor="middle">A</text>
      <rect x="42" y="8" width="80" height="6" rx="2" fill="#1f5e57"></rect>
      <rect x="148" y="8" width="80" height="5" rx="2" fill="#2a9d8f"></rect>
      <rect x="244" y="8" width="64" height="5" rx="2" fill="#1f5e57" opacity="0.55"></rect>
      <rect x="320" y="8" width="50" height="5" rx="2" fill="#1f5e57" opacity="0.55"></rect>
    </g>
    <g transform="translate(0 52)">
      <rect width="380" height="22" fill="#ece6d6"></rect>
      <circle cx="22" cy="11" r="8" fill="#2a9d8f"></circle>
      <text x="22" y="14" font-family="ui-monospace,Menlo,monospace" font-size="9" font-weight="700" fill="#f5f0e8" text-anchor="middle">B</text>
      <rect x="42" y="8" width="68" height="6" rx="2" fill="#1f5e57"></rect>
      <rect x="148" y="8" width="92" height="5" rx="2" fill="#2a9d8f"></rect>
      <rect x="244" y="8" width="64" height="5" rx="2" fill="#1f5e57" opacity="0.55"></rect>
      <rect x="320" y="8" width="50" height="5" rx="2" fill="#1f5e57" opacity="0.55"></rect>
    </g>
    <g transform="translate(0 74)">
      <rect width="380" height="22" fill="#f5f0e8"></rect>
      <circle cx="22" cy="11" r="8" fill="#1f5e57"></circle>
      <text x="22" y="14" font-family="ui-monospace,Menlo,monospace" font-size="9" font-weight="700" fill="#c8d97a" text-anchor="middle">C</text>
      <rect x="42" y="8" width="74" height="6" rx="2" fill="#1f5e57"></rect>
      <rect x="148" y="8" width="84" height="5" rx="2" fill="#2a9d8f"></rect>
      <rect x="244" y="8" width="64" height="5" rx="2" fill="#1f5e57" opacity="0.55"></rect>
      <rect x="320" y="8" width="50" height="5" rx="2" fill="#1f5e57" opacity="0.55"></rect>
    </g>
    <g transform="translate(0 96)">
      <rect width="380" height="22" fill="#ece6d6"></rect>
      <circle cx="22" cy="11" r="8" fill="#d97560"></circle>
      <text x="22" y="14" font-family="ui-monospace,Menlo,monospace" font-size="9" font-weight="700" fill="#f5f0e8" text-anchor="middle">D</text>
      <rect x="42" y="8" width="86" height="6" rx="2" fill="#1f5e57"></rect>
      <rect x="148" y="8" width="76" height="5" rx="2" fill="#2a9d8f"></rect>
      <rect x="244" y="8" width="64" height="5" rx="2" fill="#1f5e57" opacity="0.55"></rect>
      <rect x="320" y="8" width="50" height="5" rx="2" fill="#1f5e57" opacity="0.55"></rect>
    </g>
    <g transform="translate(0 118)" opacity="0.5">
      <rect width="380" height="22" fill="#f5f0e8"></rect>
      <circle cx="22" cy="11" r="8" fill="#c8d97a"></circle>
      <rect x="42" y="8" width="64" height="6" rx="2" fill="#1f5e57"></rect>
      <rect x="148" y="8" width="88" height="5" rx="2" fill="#2a9d8f"></rect>
      <rect x="244" y="8" width="64" height="5" rx="2" fill="#1f5e57" opacity="0.55"></rect>
      <rect x="320" y="8" width="50" height="5" rx="2" fill="#1f5e57" opacity="0.55"></rect>
    </g>
  </g>
  <g transform="translate(478 200)">
    <circle r="34" fill="#c8d97a"></circle>
    <circle r="34" fill="none" stroke="#2c2924" stroke-width="1.5" opacity="0.4" stroke-dasharray="2 3"></circle>
    <text x="0" y="6" font-family="ui-monospace,Menlo,monospace" font-size="16" font-weight="700" fill="#2c2924" text-anchor="middle">×200</text>
  </g>
  <g transform="translate(310 50)">
    <g>
      <rect x="0" y="0" width="50" height="18" rx="9" fill="#2a9d8f"></rect>
      <text x="25" y="12" font-family="ui-monospace,Menlo,monospace" font-size="9" font-weight="700" fill="#f5f0e8" text-anchor="middle">name</text>
    </g>
    <g transform="translate(56 0)">
      <rect width="56" height="18" rx="9" fill="#1f5e57"></rect>
      <text x="28" y="12" font-family="ui-monospace,Menlo,monospace" font-size="9" font-weight="700" fill="#c8d97a" text-anchor="middle">email</text>
    </g>
    <g transform="translate(118 0)">
      <rect width="50" height="18" rx="9" fill="#c8d97a"></rect>
      <text x="25" y="12" font-family="ui-monospace,Menlo,monospace" font-size="9" font-weight="700" fill="#2c2924" text-anchor="middle">date</text>
    </g>
    <g transform="translate(174 0)">
      <rect width="50" height="18" rx="9" fill="#2a9d8f"></rect>
      <text x="25" y="12" font-family="ui-monospace,Menlo,monospace" font-size="9" font-weight="700" fill="#f5f0e8" text-anchor="middle">uuid</text>
    </g>
  </g>
</svg>
</div>
<div class="eco-content">
<p>Realistic test data makes the difference between a demo that lands and one that doesn't. Covering how to populate your database with contextually correct fake data — names, emails, dates, UUIDs, and more — using a single CLI flag, and how to build reproducible CI fixtures and believable local development environments.</p>
<a href="/packages/seeder-faker" class="eco-read-more">Read more →</a>
</div>
</div>

<div class="eco-article">
<div class="eco-img">
<svg viewBox="0 0 540 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Logging illustration — log document and server stack">
  <rect x="60" y="282" width="420" height="2" fill="#2a9d8f" opacity="0.25"></rect>
  <g transform="translate(330 110)">
    <rect x="6" y="8" width="140" height="180" rx="6" fill="#1f5e57" opacity="0.25"></rect>
    <rect width="140" height="180" rx="6" fill="#1f5e57"></rect>
    <g>
      <rect x="10" y="12" width="120" height="36" rx="4" fill="#2a9d8f"></rect>
      <circle cx="22" cy="30" r="3.5" fill="#c8d97a"></circle>
      <circle cx="34" cy="30" r="3.5" fill="#c8d97a" opacity="0.5"></circle>
      <rect x="52" y="26" width="68" height="3" rx="1" fill="#f5f0e8" opacity="0.7"></rect>
      <rect x="52" y="33" width="50" height="3" rx="1" fill="#f5f0e8" opacity="0.45"></rect>
      <rect x="10" y="54" width="120" height="36" rx="4" fill="#2a9d8f"></rect>
      <circle cx="22" cy="72" r="3.5" fill="#c8d97a"></circle>
      <circle cx="34" cy="72" r="3.5" fill="#d97560"></circle>
      <rect x="52" y="68" width="58" height="3" rx="1" fill="#f5f0e8" opacity="0.7"></rect>
      <rect x="52" y="75" width="68" height="3" rx="1" fill="#f5f0e8" opacity="0.45"></rect>
      <rect x="10" y="96" width="120" height="36" rx="4" fill="#2a9d8f"></rect>
      <circle cx="22" cy="114" r="3.5" fill="#c8d97a"></circle>
      <circle cx="34" cy="114" r="3.5" fill="#c8d97a" opacity="0.5"></circle>
      <rect x="52" y="110" width="66" height="3" rx="1" fill="#f5f0e8" opacity="0.7"></rect>
      <rect x="52" y="117" width="46" height="3" rx="1" fill="#f5f0e8" opacity="0.45"></rect>
      <rect x="10" y="138" width="120" height="36" rx="4" fill="#2a9d8f"></rect>
      <circle cx="22" cy="156" r="3.5" fill="#c8d97a"></circle>
      <circle cx="34" cy="156" r="3.5" fill="#c8d97a" opacity="0.5"></circle>
      <rect x="52" y="152" width="56" height="3" rx="1" fill="#f5f0e8" opacity="0.7"></rect>
      <rect x="52" y="159" width="64" height="3" rx="1" fill="#f5f0e8" opacity="0.45"></rect>
    </g>
  </g>
  <g transform="translate(140 80)">
    <rect x="6" y="8" width="200" height="220" rx="8" fill="#1f5e57" opacity="0.25"></rect>
    <rect width="200" height="220" rx="8" fill="#f5f0e8"></rect>
    <path d="M 180 0 L 200 20 L 180 20 Z" fill="#e2dac3"></path>
    <rect x="18" y="20" width="100" height="8" rx="2" fill="#2a9d8f"></rect>
    <rect x="18" y="34" width="60" height="4" rx="1" fill="#2a9d8f" opacity="0.45"></rect>
    <g transform="translate(18 56)">
      <circle cx="5" cy="5" r="5" fill="#d97560"></circle>
      <rect x="18" y="3" width="150" height="5" rx="1" fill="#1f5e57" opacity="0.75"></rect>
    </g>
    <g transform="translate(18 78)">
      <circle cx="5" cy="5" r="5" fill="#2a9d8f"></circle>
      <rect x="18" y="3" width="120" height="5" rx="1" fill="#1f5e57" opacity="0.75"></rect>
    </g>
    <g transform="translate(18 100)">
      <circle cx="5" cy="5" r="5" fill="#c8d97a"></circle>
      <rect x="18" y="3" width="160" height="5" rx="1" fill="#1f5e57" opacity="0.75"></rect>
    </g>
    <g transform="translate(18 122)">
      <circle cx="5" cy="5" r="5" fill="#2a9d8f"></circle>
      <rect x="18" y="3" width="110" height="5" rx="1" fill="#1f5e57" opacity="0.75"></rect>
    </g>
    <g transform="translate(18 144)">
      <circle cx="5" cy="5" r="5" fill="#2a9d8f" opacity="0.5"></circle>
      <rect x="18" y="3" width="140" height="5" rx="1" fill="#1f5e57" opacity="0.5"></rect>
    </g>
    <g transform="translate(18 166)">
      <circle cx="5" cy="5" r="5" fill="#c8d97a" opacity="0.55"></circle>
      <rect x="18" y="3" width="150" height="5" rx="1" fill="#1f5e57" opacity="0.5"></rect>
    </g>
    <g transform="translate(18 188)">
      <circle cx="5" cy="5" r="5" fill="#2a9d8f" opacity="0.3"></circle>
      <rect x="18" y="3" width="100" height="5" rx="1" fill="#1f5e57" opacity="0.3"></rect>
    </g>
  </g>
  <g transform="translate(310 56)">
    <path d="M -22 -22 L 22 -22 Q 30 -22 30 -14 L 30 8 Q 30 16 22 16 L 4 16 L -4 26 L -2 16 L -22 16 Q -30 16 -30 8 L -30 -14 Q -30 -22 -22 -22 Z" fill="#d97560"></path>
    <rect x="-2.5" y="-15" width="5" height="14" rx="1" fill="#f5f0e8"></rect>
    <circle cx="0" cy="6" r="2.5" fill="#f5f0e8"></circle>
  </g>
  <g transform="translate(252 184)">
    <rect x="25" y="25" width="12" height="45" rx="6" fill="#1f5e57" transform="rotate(-45 25 25)"></rect>
    <circle r="42" fill="#1f5e57"></circle>
    <circle r="34" fill="#c8d97a" opacity="0.45"></circle>
    <circle r="34" fill="none" stroke="#f5f0e8" stroke-width="1.5" opacity="0.5"></circle>
    <path d="M -22 -14 Q -30 0 -22 18" stroke="#f5f0e8" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.7"></path>
  </g>
</svg>
</div>
<div class="eco-content">
<p>Structured logging is a foundational practice for any production Node.js application. Covering what logs and loggers are, how log levels work, and how to set up pino — one of the fastest loggers in the Node.js ecosystem — with child loggers, pretty printing, and best practices for capturing the right data without leaking sensitive information.</p>
<a href="/packages/logger-pino" class="eco-read-more">Read more →</a>
</div>
</div>

</div>



## The Prototyping to Production Continuum

The biggest trap in backend development is throwaway code — tools that are great on day one but force a rewrite the moment your needs grow. JSONExpress is built around a single idea: **every layer is an explicit, swappable dependency**.

<div class="steps-grid">
<div class="step-card">
<div class="step-number">1</div>
<h3>The Instant Mock API</h3>
<p>Drop JSON files and get a full CRUD API in seconds. No config, no TypeScript required. Real endpoints, real HTTP — just working.</p>
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



## How the Modular Architecture Works

One schema definition. Every layer is independently swappable.

<div class="arch-diagram">
  <div class="arch-layer">
    <div class="arch-label">Your Data</div>
    <div class="arch-boxes">
      <div class="arch-box schema">JSON file <span>or</span> TypeScript schema</div>
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
<p class="section-subtitle">Install the boot preset, drop JSON files, and you have a running API.</p>
<div class="cta-install">
<code>npm install @json-express/boot</code>
</div>
<div class="cta-buttons">
<a href="/guide/getting-started" class="cta-btn cta-primary">Read the Docs</a>
<a href="https://github.com/vaz-matri/json-express" class="cta-btn cta-secondary">View on GitHub</a>
</div>
</div>

<footer class="site-footer">
<div class="footer-grid">
<div class="footer-col">
<h4>JSONExpress</h4>
<p class="footer-tagline">Open-source Node.js meta-framework. Drop JSON files, get an API. MIT licensed.</p>
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
  margin-top: 8rem;
  padding-top: 0 !important;
  text-align: center;
}
.VPHome .vp-doc h2 + p {
  text-align: center;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 0;
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
  margin: 2rem 0 0 0;
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

/* ═══════════════ ECOSYSTEM ARTICLES ═══════════════ */
.eco-articles {
  display: flex;
  flex-direction: column;
  gap: 4rem;
  margin-top: 2.5rem;
}
.eco-article {
  display: flex;
  align-items: center;
  gap: 3.5rem;
}
.eco-article:nth-child(even) {
  flex-direction: row-reverse;
}
.eco-img {
  flex: 0 0 48%;
  border-radius: 12px;
  overflow: hidden;
  /*background: var(--vp-c-bg-alt);*/
}
.eco-img svg {
  display: block;
  width: 100%;
  height: auto;
}
.eco-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.eco-content p {
  font-size: 0.95rem;
  color: var(--vp-c-text-2);
  line-height: 1.75;
  margin: 0;
}
.eco-read-more {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--solarized-cyan);
  text-decoration: none;
  transition: color 0.2s;
  align-self: flex-start;
}
.eco-read-more:hover { color: var(--solarized-blue); text-decoration: underline; }

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
  .steps-grid  { grid-template-columns: 1fr; }
  .eco-article,
  .eco-article:nth-child(even) { flex-direction: column; }
  .eco-img     { flex: none; width: 100%; }
  .footer-grid { grid-template-columns: 1fr; }
}
</style>
