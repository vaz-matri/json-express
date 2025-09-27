<picture>
  <source media="(prefers-color-scheme: dark)" srcset="logo/logo_long_desc_dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="logo/logo_long_desc.svg">
  <img src="logo/logo_long_desc.svg" alt="JSON Express">
</picture>

Skip the backend bottleneck and go from prototype to MVP launch faster.
JSON Express converts your json files into a complete server with MVP-ready APIs,
enterprise-grade security and validation - providing the practical infrastructure
you need until your dedicated backend is ready.

visit [jsonexpress.com](https://jsonexpress.com)

## ✨ Features

- [Full REST API](#-api-endpoints) - GET, POST, PATCH, DELETE operations
- [Health Check Endpoints](#-api-endpoints) - Monitor your server health
- [Search API](#-search-api-wip) - Built-in search functionality across your data
- [HTTPS Support](#-https-setup) - Secure API with automatic SSL certificate generation
- [Schema Validation](#-schema-validation) - Validate incoming data with custom schemas
- [Authentication Support](#-authentication) - Secure specific routes with JWT and session-based auth

🔮 [See what's coming next in our Roadmap](#-roadmap)

## 🚀 Quick Start

Get up and running in seconds:

```bash
# Install globally
$ npm install -g @json-express/core

# Start the server
$ json-express
```

That's it! Your json files are now served as a REST API. JSON Express uses [faker](https://www.npmjs.com/package/@faker-js/faker) under the hood to create realistic test data, making it perfect for prototyping and development.

### Project-Specific Installation

This is an alternative method of installation. Install JSON Express directly in your project for better dependency management:

```bash
# Navigate to your project directory
$ cd project

# Install in your project
$ npm install @json-express/core

# Run with npx
$ npx json-express

# or Run as script 
  ## in package.json
  "scripts": {
    "serve": "json-express"
  }
  
  ## run script
  $ npm run serve

```

### Using Your Own JSON Files

If you prefer to use your own json files instead of the generated fake data, you can create them in your project directory.

Here are some examples of how to create your own JSON files:

```bash
# Navigate to your backend project directory
$ cd project

# Create an albums.json file
$ echo '[{"name": "Encore", "releaseDate": "12-11-2004"}, {"name": "The Marshall Mathers LP", "releaseDate": "23-05-2000"}]' > albums.json

# Create an artists.json file
$ echo '[{"name": "Eminem", "realName": "Marshall Bruce Mathers III", "dob": "17-10-1972", "genre": "Hip Hop", "country": "United States", "debutYear": 1996}, {"name": "Taylor Swift", "realName": "Taylor Alison Swift", "dob": "13-12-1989", "genre": "Pop", "country": "United States", "debutYear": 2006}]' > artists.json

# Start server
$ json-express
```

ID will be added automatically!

### Stopping the Server

To stop the JSON Express server, use `Ctrl + C` in your terminal.

## 📚 API Endpoints

Based on your json structure, JSON Express automatically creates RESTful endpoints:

```
GET    /albums         # Get all albums
GET    /albums/:id     # Get album with id
POST   /albums         # Create a new album
PATCH  /albums/:id     # Partially update album with id 
DELETE /albums/:id     # Delete album with id 

GET    /search         # Search across all data
GET    /health         # Health check endpoint
```

### Testing API endpoints

You can test your API endpoints using curl:

```bash
# Get all artists
$ curl http://localhost:3000/artists

# Get all albums
$ curl http://localhost:3000/albums

# Get a specific artist by ID
$ curl http://localhost:3000/artists/1

# Create a new artist
$ curl -X POST http://localhost:3000/artists \
  -H "Content-Type: application/json" \
  -d '{"name": "Drake", "realName": "Aubrey Drake Graham", "dob": "24-10-1986"}'

# Create a new album
$ curl -X POST http://localhost:3000/albums \
  -H "Content-Type: application/json" \
  -d '{"name": "Recovery", "releaseDate": "21-06-2010"}'

# Update an album
$ curl -X PATCH http://localhost:3000/albums/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Recovery (Deluxe Edition)"}'

# Delete an album
$ curl -X DELETE http://localhost:3000/albums/1

# Test health check endpoint
$ curl http://localhost:3000/health
```

## 🔍 Search API (WIP)

JSON Express includes a built-in search endpoint that allows you to search across your data:

```bash
# Basic search (HTTP)
$ curl http://localhost:3000/search?q=eminem
```

---

**Note**: The sections below require configuration via a `config.json` file. While JSON Express works perfectly with **zero configuration** for basic REST APIs, advanced features need some setup. For complete configuration options, see the [Configuration](#-configuration) section at the end of this document.

---

## 🔒 HTTPS Setup

To run your server with HTTPS, configure the protocol in your `config.json` file:

```json
{
  "protocol": "https"
}
```
JSON Express uses [devcert](https://www.npmjs.com/package/devcert) under the hood to generate certificates

**First-time HTTPS setup requires elevated permissions** for SSL certificate generation:

- **Windows**: Run as Administrator
- **macOS**: Enter user password when prompted
- **Linux**: Run with `sudo`

After the initial certificate creation, you can run the server with normal permissions. The certificates are automatically managed and only need to be created once.

### Testing HTTPS endpoints

```bash
# Basic endpoint with HTTPS
$ curl https://localhost:8080/albums

# Test HTTPS-specific trusted endpoints (not available in HTTP)
$ curl https://localhost:8080/api/trusted
$ curl https://localhost:8080/api/trusted-data
```

## 📋 Schema Validation

When schema validation is enabled in your configuration, JSON Express will validate incoming requests against your defined schema and uses [joi](https://www.npmjs.com/package/joi) under the hood


Configure your `config.json` file:

```json
{
  "schema.validation": "strict",
  
  "routes": {
    "<route_name>": {
      "schema": {
        "<field_name>": {
          "type": "string",
          "required": true
        }
      }
    }
  }
}
```

**Note:** More validations are coming soon

### Testing schema validated endpoints

```bash
# Example: This will succeed (matches schema requirements)
$ curl -X POST https://localhost:8080/albums \
  -H "Content-Type: application/json" \
  -d '{"name": "Recovery", "releaseDate": "21-06-2010"}'

# Example: This will fail with validation error (missing required field)
$ curl -X POST https://localhost:8080/albums \
  -H "Content-Type: application/json" \
  -d '{"name": "Recovery"}'
# Response: {"error": "Validation failed", "message": "releaseDate is required"}
```

## 🔐 Authentication

JSON Express supports JWT-based route-level authentication and uses [passport](https://www.npmjs.com/package/passport) under the hood. You can secure specific routes by configuring them in your `config.json` file.

### Setting Up Authenticated Routes

Create or update your `config.json` file to include route-specific authentication:

```json
{
  "routes": {
    "albums": {
      "auth": true
    }
  }
}
```

In this example, the `/albums` endpoints require authentication, while `/artists` endpoints remain public (no configuration needed for public routes).

#### Testing Public Routes (No Authentication Required)

With the above configuration, you can still access public routes without authentication:

```bash
# This works - artists is public
$ curl https://localhost:8080/artists

# This fails - albums is protected (shows auth requirement)
$ curl https://localhost:8080/albums
# Response: {"error": "Unauthorized", "message": "JWT token required"}
```

### Getting a JWT Token

To access protected routes, you first need to obtain a JWT token by logging in:

```bash
# Login with any username and password to get JWT token (HTTP)
$ curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'

# Login with HTTPS
$ curl -X POST https://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'
```

**Note**: You can use any username and password combination - the login endpoint accepts any credentials for development purposes.

The response will contain your JWT token:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Using Authenticated Routes

When a route has authentication enabled, you'll need to include the JWT token in the authorization header:

```bash
# Example: Access protected albums endpoint
$ curl -H "Authorization: Bearer YOUR_JWT_TOKEN" https://localhost:8080/albums

# Example: Without token - fails with auth error
$ curl https://localhost:8080/albums
# Response: {"error": "Unauthorized", "message": "JWT token required"}
```

**Note**: Replace `YOUR_JWT_TOKEN` with the actual JWT token received from the login endpoint.

### Testing authenticated API endpoints

```bash
# Get JWT token first
$ curl -X POST https://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'
# Response: {"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}

# Test authentication behavior - these show the difference
$ curl https://localhost:8080/albums
# Fails: {"error": "Unauthorized"}

$ curl -H "Authorization: Bearer YOUR_JWT_TOKEN" https://localhost:8080/albums  
# Works: Returns album data

# Test protected search (if search route is configured with auth)
$ curl -H "Authorization: Bearer YOUR_JWT_TOKEN" https://localhost:8080/search?q=term
```

## ⚙️ Configuration

JSON Express favors convention over configuration, but when you need customization, simply create a `config.json` file in the same directory as your JSON data files.

### Creating a Configuration File

```bash
# Create config.json in your project directory
echo '{"PORT": 8080, "protocol": "https"}' > config.json
```

### Advanced Configuration

For more advanced features like authentication and schema validation, you can extend your configuration:

```json
{
  "PORT": 8080,
  "protocol": "https",
  "schema.validation": "strict",
  "routes": {
    "<route_name>": {
      "auth": true,
      "schema": {
        "<field_name>": {
          "type": "string",
          "required": true
        }
      }
    }
  }
}
```

### Configuration Properties

| Property | Type | Default  | Description                                              |
|----------|------|----------|----------------------------------------------------------|
| **PORT** | number | 3000     | Server port                                              |
| **protocol** | string | http     | Server protocol (http or https)                          |
| **auth** | boolean | false    | Enable authentication for specific routes                |
| **schema.validation** | string | optional | Enable strict schema validation ("strict" or "optional") |

For a complete configuration example with mixed authentication settings, see [config.json](../../example/config.json).

## 🔮 Roadmap

- **GraphQL API** - Query your data with GraphQL alongside REST
- **RPC Support** - Remote procedure calls for advanced API patterns
- **Google Sign-In** - OAuth authentication with Google accounts
- **Database Storage** - Persist data in databases alongside file storage

## 📄 License

[MIT License](LICENSE)

## 🐛 Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/vaz-matri/json-express/issues).
