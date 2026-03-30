<picture>
  <source media="(prefers-color-scheme: dark)" srcset="logo/logo_long_desc_dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="logo/logo_long_desc.svg">
  <img src="logo/logo_long_desc.svg" alt="JSON Express">
</picture>

Skip the backend bottleneck and go from prototype to MVP launch faster.
**JSON Express v2.0** has evolved into a highly modular, pluggable Meta-Framework. It instantly converts your JSON files into a complete server, providing the practical infrastructure you need until your dedicated backend is ready.

visit [jsonexpress.com](https://jsonexpress.com)

## ✨ Features

- **Zero-Config REST API** - Instantly generates GET, POST, PATCH, and DELETE operations.
- **Relational Data** - Automatically resolves linked data across collections using `id` and `ref`.
- **Agnostic Microkernel** - Pluggable architecture! Swap out the Database, Server (Transport), or API Paradigm without rewriting your logic.
- **TypeScript First** - Built with strict contracts to ensure enterprise-grade stability.

🔮[See what's coming next in our Roadmap](#-roadmap) (Including Auth, Validation, and GraphQL!)

## 🚀 Quick Start

Get up and running in seconds without installing anything globally:

```bash
# 1. Create a directory for your data
$ mkdir my-api && cd my-api

# 2. Create some JSON data
$ echo '[{"id": "1", "name": "The Marshall Mathers LP", "artist": "Eminem"}]' > albums.json

# 3. Run JSON Express via npx!
$ npx @json-express/cli
```

That's it! Your `albums.json` file is now served as a fully functional REST API.

### Project-Specific Installation

If you want to install JSON Express directly in your project for better dependency management:

```bash
# Install the CLI in your project
$ npm install @json-express/cli -D

# Add a script to your package.json
# "scripts": { "serve": "json-express" }

# Start the server
$ npm run serve
```

## 📚 API Endpoints

Based on your JSON file names (e.g., `albums.json`), JSON Express automatically creates standardized RESTful endpoints:

```
GET    /albums         # Get all albums (Supports query params for filtering)
GET    /albums/:id     # Get album by ID
POST   /albums         # Create a new album (auto-generates ID)
PATCH  /albums/:id     # Partially update album by ID
DELETE /albums/:id     # Delete album by ID
```

### Testing API endpoints

You can test your API endpoints using `curl` or tools like Postman:

```bash
# Get all albums
$ curl http://localhost:3000/albums

# Search/Filter albums (e.g., ?artist=Eminem)
$ curl http://localhost:3000/albums?artist=Eminem

# Create a new album
$ curl -X POST http://localhost:3000/albums \
  -H "Content-Type: application/json" \
  -d '{"name": "Recovery", "artist": "Eminem"}'

# Update an album
$ curl -X PATCH http://localhost:3000/albums/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Recovery (Deluxe Edition)"}'

# Delete an album
$ curl -X DELETE http://localhost:3000/albums/1
```

## ⚙️ Configuration

JSON Express favors convention over configuration. To customize the server, simply create a `config.json` file in the same directory as your JSON data files.

```json
{
  "port": 8080
}
```
*(More configuration options for plugins will be available as the v2.0 ecosystem expands!)*

## 🔮 Roadmap (Upcoming v2 Features)

We are currently porting advanced features from v1 to our new v2.0 plugin architecture. Expect these soon:

- **Middleware Layer** - Hook into the request lifecycle for Auth, Validation, and Logging.
- **Authentication Plugin** - JWT and session-based auth to secure specific routes.
- **Schema Validation Plugin** - Validate incoming data with custom schemas (Joi/Zod).
- **GraphQL API Generator** - Query your data with GraphQL alongside (or instead of) REST.
- **Fastify & h3 Transports** - Swap out Express for faster, modern server engines.
- **Database Adapters** - Persist data in MongoDB or PostgreSQL instead of memory.
- **HTTPS Setup** - Automatic local SSL certificate generation.
- **Global Search & Health API** - Built-in `/search` and `/health` endpoints.

## 📄 License[MIT License](LICENSE)

## 🐛 Issues

Found a bug or have a feature request? Please[open an issue](https://github.com/vaz-matri/json-express/issues).
