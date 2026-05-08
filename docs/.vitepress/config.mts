import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "JSONExpress",
  description: "From JSON to Enterprise REST & GraphQL API in 0 seconds. Open-source Node.js meta-framework with pluggable databases, identity management, and 23 modular packages.",
  cleanUrls: true,
  sitemap: {
    hostname: 'https://jsonexpress.com'
  },
  head: [
    ['meta', { name: 'google-site-verification', content: 'FqePtk21d7xIR5ykuGM0Q9I3pU0i5gr9rdHlbTjCsn4' }],
    ['meta', { name: 'theme-color', content: '#2aa198' }],
    ['meta', { name: 'keywords', content: 'JSONExpress, Node.js API framework, REST API generator, GraphQL API generator, headless CMS, TypeScript backend, JSON to API, pluggable database, Express.js alternative, Fastify framework' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: 'https://jsonexpress.com/docs' }],
    ['meta', { property: 'og:site_name', content: 'JSONExpress' }],
    ['meta', { property: 'og:title', content: 'JSONExpress — From JSON to Enterprise API in 0 Seconds' }],
    ['meta', { property: 'og:description', content: 'Open-source Node.js meta-framework that turns raw JSON files into production-ready REST & GraphQL APIs with built-in identity, security, and 23 pluggable packages.' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'JSONExpress — From JSON to Enterprise API in 0 Seconds' }],
    ['meta', { name: 'twitter:description', content: 'Drop a JSON file → get REST & GraphQL. Scale to TypeScript when you need identity, hooks, and field-level security.' }],
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' }],
    ['script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-DNLM3X80RS' }],
    ['script', {}, `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-DNLM3X80RS');`],
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
    logo: '/logo.svg',

    nav: [
      { text: 'Docs', link: '/getting-started' },
      { text: 'Ecosystem', link: '/core' },
      {
        text: 'Learn',
        items: [
          {
            text: 'JSONExpress',
            items: [
              { text: 'Releases & Updates', link: '/blog/releases/' },
              { text: 'Framework Tutorials', link: '/blog/tutorials/' }
            ]
          },
          {
            text: 'Engineering',
            items: [
              { text: 'Technical Blogs', link: '/blog/engineering/' },
              { text: 'Tech News & Reviews', link: '/blog/news/' }
            ]
          }
        ]
      }
    ],

    sidebar: {
      '/blog/tutorials/': [
        {
          text: 'Framework Tutorials',
          items: [
            { text: 'Overview', link: '/blog/tutorials/' }
          ]
        }
      ],

      '/blog/releases/': [
        {
          text: 'Releases & Updates',
          items: [
            { text: 'Overview', link: '/blog/releases/' }
          ]
        }
      ],

      '/blog/engineering/': [
        {
          text: 'Engineering',
          items: [
            { text: 'Overview', link: '/blog/engineering/' }
          ]
        }
      ],

      '/blog/news/': [
        {
          text: 'Tech News & Reviews',
          items: [
            { text: 'Overview', link: '/blog/news/' }
          ]
        }
      ],

      '/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/getting-started' },
            { text: 'Zero-Config JSON Mode', link: '/json-mode' },
            { text: 'Presets', link: '/presets' },
            { text: 'Architecture', link: '/architecture' }
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Schemas & Models', link: '/schemas' },
            { text: 'Database Adapters', link: '/adapters' },
            { text: 'Hooks & Security', link: '/hooks' }
          ]
        },
        {
          text: 'Plugins',
          items: [
            { text: 'Identity & Auth', link: '/identity' },
            { text: 'API Generation', link: '/api' },
            { text: 'KV & Queues', link: '/background' }
          ]
        },
        {
          text: 'Ecosystem',
          items: [
            {
              text: 'Core & Runtime',
              collapsed: true,
              items: [
                { text: '@json-express/core', link: '/core' },
                { text: '@json-express/boot', link: '/boot' },
                { text: '@json-express/config', link: '/config' },
                { text: '@json-express/config-env', link: '/config-env' }
              ]
            },
            {
              text: 'Transports',
              collapsed: true,
              items: [
                { text: 'transport-express', link: '/transport-express' },
                { text: 'transport-fastify', link: '/transport-fastify' }
              ]
            },
            {
              text: 'Database Adapters',
              collapsed: true,
              items: [
                { text: 'adapter-json', link: '/adapter-json' },
                { text: 'adapter-memory', link: '/adapter-memory' }
              ]
            },
            {
              text: 'API Generators',
              collapsed: true,
              items: [
                { text: 'api-rest', link: '/api-rest' },
                { text: 'api-graphql', link: '/api-graphql' }
              ]
            },
            {
              text: 'Middleware',
              collapsed: true,
              items: [
                { text: 'middleware-auth', link: '/middleware-auth' },
                { text: 'middleware-validation', link: '/middleware-validation' }
              ]
            },
            {
              text: 'Plugins',
              collapsed: true,
              items: [
                { text: 'plugin-identity', link: '/plugin-identity' },
                { text: 'plugin-health', link: '/plugin-health' },
                { text: 'plugin-devcert', link: '/plugin-devcert' },
                { text: 'docs-swagger', link: '/docs-swagger' },
                { text: 'docs-light', link: '/docs-light' }
              ]
            },
            {
              text: 'Background Services',
              collapsed: true,
              items: [
                { text: 'kv-memory', link: '/kv-memory' },
                { text: 'queue-memory', link: '/queue-memory' },
                { text: 'email-console', link: '/email-console' }
              ]
            },
            {
              text: 'Utilities',
              collapsed: true,
              items: [
                { text: 'logger-pino', link: '/logger-pino' },
                { text: 'logger-console', link: '/logger-console' },
                { text: 'seeder-faker', link: '/seeder-faker' }
              ]
            }
          ]
        },
        {
          text: 'Compare',
          items: [
            { text: 'vs json-server', link: '/compare/json-server' },
            { text: 'vs Strapi', link: '/compare/strapi' },
            { text: 'vs Payload', link: '/compare/payload' },
            { text: 'vs Mockoon', link: '/compare/mockoon' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vazmat/json-express' }
    ]
  }
})
