# @json-express/config

The advanced Configuration Provider for [JSON Express](https://github.com/vaz-matri/json-express).

For power-users and enterprise environments, this plugin allows you to configure your framework using tracked JSON, YAML, or dynamic JS/TS files. It acts as a robust supplement to the default `.env` configuration.

## 📦 Installation

Because this is an advanced opt-in plugin, you must install it explicitly:

```bash
npm install @json-express/config
```

## 🚀 Usage & File Naming

This plugin automatically looks for configuration files in the root of your project matching the following pattern:
👉 `jex.config.(json|yml|yaml|js|cjs|mjs|ts)`

### YAML / JSON Example
```yaml
# jex.config.yml
port: 8080
transport:
  express:
    logger: true
database:
  max_connections: 100
```

### Dynamic JS/TS (Functional Configs)
If you use a JavaScript or TypeScript file, you can export a function. The framework will pass the active `NODE_ENV` into your function, allowing you to write environment-aware logic dynamically!

```javascript
// jex.config.js
export default ({ env }) => {
  return {
    database: {
      host: env === 'production' ? 'aws-rds.internal' : 'localhost',
      max_connections: env === 'production' ? 500 : 10
    }
  };
};
```

## ⚙️ Environment Cascading & Merging

If you define a `jex.config.json` and a `jex.config.production.json`, this plugin will automatically perform a Deep Merge, applying the production overrides on top of your base config when `NODE_ENV=production`.

*Note: Environment variables defined in your `.env` file (via `@json-express/config-env`) will always take ultimate precedence and override these files. This allows you to commit `jex.config.yml` safely while keeping secrets in `.env`.*

## 📄 License
[MIT License](../../LICENSE)
