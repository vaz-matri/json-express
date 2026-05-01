import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "JSONExpress",
  description: "From JSON to Enterprise REST & GraphQL API in 0 seconds. Open-source Node.js meta-framework with pluggable databases, identity management, and 23 modular packages.",
  base: '/docs/',
  cleanUrls: true,
  sitemap: {
    hostname: 'https://jsonexpress.com/docs'
  },
  head: [
    ['meta', { name: 'theme-color', content: '#2aa198' }],
    ['meta', { name: 'keywords', content: 'JSONExpress, Node.js API framework, REST API generator, GraphQL API generator, headless CMS, TypeScript backend, JSON to API, pluggable database, Express.js alternative, Fastify framework' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'JSONExpress' }],
    ['meta', { property: 'og:title', content: 'JSONExpress — From JSON to Enterprise API in 0 Seconds' }],
    ['meta', { property: 'og:description', content: 'Open-source Node.js meta-framework that turns raw JSON files into production-ready REST & GraphQL APIs with built-in identity, security, and 23 pluggable packages.' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'JSONExpress — From JSON to Enterprise API in 0 Seconds' }],
    ['meta', { name: 'twitter:description', content: 'Drop a JSON file → get REST & GraphQL. Scale to TypeScript when you need identity, hooks, and field-level security.' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' }],
    ['script', { type: 'application/ld+json' }, JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "JSONExpress",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "Cross-platform",
      "description": "Open-source Node.js meta-framework that generates REST and GraphQL APIs from JSON files and TypeScript schemas.",
      "url": "https://jsonexpress.com",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
    })]
  ],
  markdown: {
    theme: {
      light: 'solarized-light',
      dark: 'solarized-dark'
    }
  },
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Ecosystem', link: '/packages/core' },
      {
        text: 'Quick Links',
        items: [
          { text: 'Zero-Config JSON Mode', link: '/guide/json-mode' },
          { text: 'Schemas & Models', link: '/guide/schemas' },
          { text: 'Identity & Auth', link: '/plugins/identity' },
          { text: 'REST API Generator', link: '/packages/api-rest' },
          { text: 'GraphQL API Generator', link: '/packages/api-graphql' },
        ]
      }
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Zero-Config JSON Mode', link: '/guide/json-mode' },
          { text: 'Enterprise Architecture', link: '/guide/architecture' }
        ]
      },
      {
        text: 'Core Concepts',
        items: [
          { text: 'Schemas & Models', link: '/guide/schemas' },
          { text: 'Database Adapters', link: '/guide/adapters' },
          { text: 'Hooks & Security', link: '/guide/hooks' }
        ]
      },
      {
        text: 'Plugins',
        items: [
          { text: 'Identity & Auth', link: '/plugins/identity' },
          { text: 'API Generation (REST/GraphQL)', link: '/plugins/api' },
          { text: 'KV & Queues', link: '/plugins/background' }
        ]
      },
      {
        text: 'Ecosystem (Packages)',
        items: [
          {
            text: 'Core & CLI',
            collapsed: true,
            items: [
              { text: '@json-express/core', link: '/packages/core' },
              { text: '@json-express/cli', link: '/packages/cli' },
              { text: '@json-express/config', link: '/packages/config' },
              { text: '@json-express/config-env', link: '/packages/config-env' }
            ]
          },
          {
            text: 'Transports (Servers)',
            collapsed: true,
            items: [
              { text: '@json-express/transport-express', link: '/packages/transport-express' },
              { text: '@json-express/transport-fastify', link: '/packages/transport-fastify' }
            ]
          },
          {
            text: 'Database Adapters',
            collapsed: true,
            items: [
              { text: '@json-express/adapter-json', link: '/packages/adapter-json' },
              { text: '@json-express/adapter-memory', link: '/packages/adapter-memory' }
            ]
          },
          {
            text: 'API Generators',
            collapsed: true,
            items: [
              { text: '@json-express/api-rest', link: '/packages/api-rest' },
              { text: '@json-express/api-graphql', link: '/packages/api-graphql' }
            ]
          },
          {
            text: 'Middleware',
            collapsed: true,
            items: [
              { text: '@json-express/middleware-auth', link: '/packages/middleware-auth' },
              { text: '@json-express/middleware-validation', link: '/packages/middleware-validation' }
            ]
          },
          {
            text: 'Plugins',
            collapsed: true,
            items: [
              { text: '@json-express/plugin-identity', link: '/packages/plugin-identity' },
              { text: '@json-express/plugin-health', link: '/packages/plugin-health' },
              { text: '@json-express/plugin-devcert', link: '/packages/plugin-devcert' },
              { text: '@json-express/docs-swagger', link: '/packages/docs-swagger' },
              { text: '@json-express/docs-light', link: '/packages/docs-light' }
            ]
          },
          {
            text: 'Background Services',
            collapsed: true,
            items: [
              { text: '@json-express/kv-memory', link: '/packages/kv-memory' },
              { text: '@json-express/queue-memory', link: '/packages/queue-memory' },
              { text: '@json-express/email-console', link: '/packages/email-console' }
            ]
          },
          {
            text: 'Utilities',
            collapsed: true,
            items: [
              { text: '@json-express/logger-pino', link: '/packages/logger-pino' },
              { text: '@json-express/logger-console', link: '/packages/logger-console' },
              { text: '@json-express/seeder-faker', link: '/packages/seeder-faker' }
            ]
          }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vazmat/json-express' }
    ]
  }
})
