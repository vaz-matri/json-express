import { defineConfig } from 'vitepress'

const SITE = 'https://www.jsonexpress.com'

export default defineConfig({
  transformHead({ pageData }) {
    const slug = pageData.relativePath
      .replace(/index\.md$/, '')
      .replace(/\.md$/, '')
    const canonical = slug ? `${SITE}/${slug}` : SITE
    return [['link', { rel: 'canonical', href: canonical }]]
  },
  title: "JSONExpress",
  description: "JSONExpress is an infrastructure-agnostic Node.js framework. Generate instant REST & GraphQL APIs from simple JSON files, then scale to production with swappable Postgres, Fastify, and Auth0—without rewriting your code.",
  cleanUrls: true,
  srcExclude: ['blog/engineering', 'blog/news', 'blog/releases/', 'blog/tutorials/'],
  sitemap: {
    hostname: 'https://www.jsonexpress.com'
  },
  head: [
    ['meta', { name: 'google-site-verification', content: 'FqePtk21d7xIR5ykuGM0Q9I3pU0i5gr9rdHlbTjCsn4' }],
    ['meta', { name: 'theme-color', content: '#2aa198' }],
    ['meta', { name: 'author', content: 'vaz' }],
    ['meta', { name: 'keywords', content: 'JSONExpress, Node.js framework, declarative API, JSON to REST API, GraphQL generator, headless CMS alternative, TypeScript backend, infrastructure-agnostic, schema-driven API' }],
    ['meta', { property: 'og:image', content: 'https://www.jsonexpress.com/og-image.png' }],
    ['meta', { name: 'twitter:image', content: 'https://www.jsonexpress.com/og-image.png' }],
    ['meta', { name: 'twitter:site', content: '@vazmat0' }],
    ['meta', { name: 'twitter:creator', content: '@vazmat0' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: 'https://www.jsonexpress.com' }],
    ['meta', { property: 'og:site_name', content: 'JSONExpress' }],
    ['meta', { property: 'og:title', content: 'JSONExpress — Stop Rewriting Your Backend' }],
    ['meta', { property: 'og:description', content: 'A modular Node.js framework that generates instant APIs from simple JSON files. Scale to production with swappable databases and transports without changing your code.' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'JSONExpress — Stop Rewriting Your Backend' }],
    ['meta', { name: 'twitter:description', content: 'A modular Node.js framework that generates instant APIs from simple JSON files. Scale to production with swappable databases and transports without changing your code.' }],
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
      "url": "https://www.jsonexpress.com",
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
    logo: { light: '/logo-long-light.svg', dark: '/logo-long-dark.svg' },
    siteTitle: false,

    nav: [
      { text: 'Docs', link: '/guide/getting-started' },
      { text: 'Packages', link: '/packages/core' },
      { text: 'Blog', link: '/blog' },
      // {
      //   text: 'Learn',
      //   items: [
      //     {
      //       text: 'JSONExpress',
      //       items: [
      //         { text: 'Releases & Updates', link: '/blog/releases/' },
      //         { text: 'Framework Tutorials', link: '/blog/tutorials/' }
      //       ]
      //     },
      //     {
      //       text: 'Engineering',
      //       items: [
      //         { text: 'Technical Blogs', link: '/blog/engineering/' },
      //         { text: 'Tech News & Reviews', link: '/blog/news/' }
      //       ]
      //     }
      //   ]
      // }
    ],

    sidebar: {
      // '/blog/tutorials/': [
      //   {
      //     text: 'Framework Tutorials',
      //     items: [
      //       { text: 'Overview', link: '/blog/tutorials/' }
      //     ]
      //   }
      // ],
      //
      // '/blog/releases/': [
      //   {
      //     text: 'Releases & Updates',
      //     items: [
      //       { text: 'Overview', link: '/blog/releases/' }
      //     ]
      //   }
      // ],
      //
      // '/blog/engineering/': [
      //   {
      //     text: 'Engineering',
      //     items: [
      //       { text: 'Overview', link: '/blog/engineering/' }
      //     ]
      //   }
      // ],
      //
      // '/blog/news/': [
      //   {
      //     text: 'Tech News & Reviews',
      //     items: [
      //       { text: 'Overview', link: '/blog/news/' }
      //     ]
      //   }
      // ],

      '/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Zero-Config JSON Mode', link: '/guide/json-mode' },
            { text: 'Presets', link: '/guide/presets' },
            { text: 'Architecture', link: '/guide/architecture' },
            { text: 'Migrating to v2', link: '/guide/migration-v2' }
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
            { text: 'Identity & Auth', link: '/guide/identity' },
            { text: 'API Generation', link: '/guide/api' },
            { text: 'KV & Queues', link: '/guide/background' }
          ]
        },
        {
          text: 'Packages',
          items: [
            {
              text: 'Core & Runtime',
              collapsed: true,
              items: [
                { text: '@json-express/core', link: '/packages/core' },
                { text: '@json-express/boot', link: '/packages/boot' },
                { text: '@json-express/config', link: '/packages/config' },
                { text: '@json-express/config-env', link: '/packages/config-env' }
              ]
            },
            {
              text: 'Transports',
              collapsed: true,
              items: [
                { text: 'transport-express', link: '/packages/transport-express' },
                { text: 'transport-fastify', link: '/packages/transport-fastify' }
              ]
            },
            {
              text: 'Database Adapters',
              collapsed: true,
              items: [
                { text: 'adapter-postgres', link: '/packages/adapter-postgres' },
                { text: 'adapter-mongodb', link: '/packages/adapter-mongodb' },
                { text: 'adapter-json', link: '/packages/adapter-json' },
                { text: 'adapter-memory', link: '/packages/adapter-memory' }
              ]
            },
            {
              text: 'API Generators',
              collapsed: true,
              items: [
                { text: 'api-rest', link: '/packages/api-rest' },
                { text: 'api-graphql', link: '/packages/api-graphql' }
              ]
            },
            {
              text: 'Middleware',
              collapsed: true,
              items: [
                { text: 'middleware-auth', link: '/packages/middleware-auth' },
                { text: 'middleware-validation', link: '/packages/middleware-validation' }
              ]
            },
            {
              text: 'Plugins',
              collapsed: true,
              items: [
                { text: 'plugin-identity', link: '/packages/plugin-identity' },
                { text: 'plugin-health', link: '/packages/plugin-health' },
                { text: 'plugin-devcert', link: '/packages/plugin-devcert' },
                { text: 'docs-swagger', link: '/packages/docs-swagger' },
                { text: 'docs-light', link: '/packages/docs-light' }
              ]
            },
            {
              text: 'Background Services',
              collapsed: true,
              items: [
                { text: 'queue-redis', link: '/packages/queue-redis' },
                { text: 'kv-redis', link: '/packages/kv-redis' },
                { text: 'kv-memory', link: '/packages/kv-memory' },
                { text: 'queue-memory', link: '/packages/queue-memory' },
                { text: 'email-console', link: '/packages/email-console' }
              ]
            },
            {
              text: 'Utilities',
              collapsed: true,
              items: [
                { text: 'logger-pino', link: '/packages/logger-pino' },
                { text: 'logger-console', link: '/packages/logger-console' },
                { text: 'seeder-faker', link: '/packages/seeder-faker' }
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
      { icon: 'github', link: 'https://github.com/vaz-matri/json-express' }
    ]
  }
})
