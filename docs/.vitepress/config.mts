import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "JSON Express",
  description: "Enterprise Headless CMS Meta-Framework",
  cleanUrls: true,
  sitemap: {
    hostname: 'https://json-express.dev'
  },
  head: [
    ['meta', { name: 'theme-color', content: '#2aa198' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'JSON Express - Enterprise Headless CMS' }],
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
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vazmat/json-express' }
    ]
  }
})
