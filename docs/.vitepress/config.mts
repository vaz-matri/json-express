import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "JSONExpress",
  description: "Enterprise Headless CMS Meta-Framework",
  cleanUrls: true,
  sitemap: {
    hostname: 'https://json-express.dev'
  },
  head: [
    ['meta', { name: 'theme-color', content: '#2aa198' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'JSONExpress - Enterprise Headless CMS' }],
    ['meta', { property: 'og:description', content: 'A blazingly fast, highly pluggable meta-framework for Node.js' }]
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
      { text: 'Guide', link: '/guide/getting-started' }
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
