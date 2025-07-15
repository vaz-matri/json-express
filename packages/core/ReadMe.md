# JSON Express

A feature-rich, fast JSON mock server for rapid API prototyping and development. Get a full REST API with zero coding in seconds.
**🌐 Homepage** [jsonexpress.com](https://jsonexpress.com)

## ✨ Features

- **Zero Configuration** - Just install and start your mock server
- **Authentication Support** - Secure specific routes with JWT and session-based auth
- **HTTPS Support** - Secure API with automatic SSL certificate generation
- **Full REST API** - GET, POST, PATCH, DELETE operations
- **Schema Validation** - Validate incoming data with custom schemas
- **Search API** - Built-in search functionality across your data
- **Health Check Endpoints** - Monitor your server health
- **CORS Enabled** - Cross-origin requests supported out of the box

## 🚀 Quick Start

Get up and running in seconds:

```bash
# Install globally
$ npm install -g @json-express/core

# Start the server
$ json-express
```

That's it! Your JSON files are now served as a REST API. JSON Express uses **@faker-js/faker** under the hood to create realistic test data, making it perfect for prototyping and development.

## 📦 Project-Specific Installation

This is an alternative method of installation. Install JSON Express directly in your project for better dependency management:

```bash
# Navigate to your project directory
$ cd project

# Install in your project
$ npm install @json-express/core

# Run with npx
$ npx json-express
```

## 📁 Using Your Own JSON Files

If you prefer to use your own JSON files instead of the generated fake data, you can create them in your project directory.

Here are some examples of how to create your own JSON files:

```bash
# Navigate to your project directory
$ cd project

# Create an albums.json file
$ echo '[{"name": "Encore", "releaseDate": "12-11-2004"}, {"name": "The Marshall Mathers LP", "releaseDate": "23-05-2000"}]' > albums.json

# Create an artists.json file
$ echo '[{"name": "Eminem", "realName": "Marshall Bruce Mathers III", "dob": "17-10-1972", "genre": "Hip Hop", "country": "United States", "debutYear": 1996}, {"name": "Taylor Swift", "realName": "Taylor Alison Swift", "dob": "13-12-1989", "genre": "Pop", "country": "United States", "debutYear": 2006}]' > artists.json

# Start server
$ json-express
```

ID will be added automatically!

### 🔒 HTTPS Setup

To run your server with HTTPS, configure the protocol in your `config.json` file:

```json
{
  "protocol": "https",
  "PORT": 8080
}
```

**First-time HTTPS setup requires elevated permissions** for SSL certificate generation:

- **Windows**: Run as Administrator
- **macOS**: Enter user password when prompted
- **Linux**: Run with sudo


After the initial certificate creation, you can run the server with normal permissions. The certificates are automatically managed and only need to be created once.

## 📚 API Endpoints

Based on your JSON structure, JSON Express automatically creates RESTful endpoints:

```
GET    /albums         # Get all albums
GET    /albums/:id     # Get album with id
POST   /albums         # Create a new album
PATCH  /albums/:id     # Partially update album with id 
DELETE /albums/:id     # Delete album with id 
GET    /search         # Search across all data
```

## 🏥 Health Check Endpoints

JSON Express includes built-in health check endpoints to monitor your server:

```bash
# Basic health check (HTTP/HTTPS)
$ curl http://localhost:8080/health
$ curl https://localhost:8080/health

# Trusted endpoints (HTTPS only)
$ curl https://localhost:8080/api/trusted
$ curl https://localhost:8080/api/trusted-data
```

**Note**: The `/api/trusted` and `/api/trusted-data` endpoints are only available when using HTTPS protocol.

## 🔍 Search API (WIP)

JSON Express includes a built-in search endpoint that allows you to search across your data:

```bash
# Search across all your data (HTTP)
$ curl http://localhost:8080/search?q=eminem

# Search with HTTPS
$ curl https://localhost:8080/search?q=eminem

# Search with authentication (if search is protected)
$ curl -H "Authorization: Bearer YOUR_JWT_TOKEN" https://localhost:8080/search?q=eminem
```

## 🔐 Authentication

JSON Express supports JWT-based route-level authentication. You can secure specific routes by configuring them in your `config.json` file.

### Setting Up Authenticated Routes

Create or update your `config.json` file to include route-specific authentication:

```json
{
  "PORT": 8080,
  "protocol": "https",
  "routes": {
    "albums": {
      "auth": true
    }
  }
}
```

In this example, the `/albums` endpoints require authentication, while `/artists` endpoints remain public (no configuration needed for public routes).

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

# Example: Create a new album on protected route
$ curl -X POST https://localhost:8080/albums \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "Recovery", "releaseDate": "21-06-2010"}'

# Example: Access public artists endpoint (no token required)
$ curl https://localhost:8080/artists
```

**Note**: Replace `YOUR_JWT_TOKEN` with the actual JWT token received from the login endpoint.

## 🧪 Testing Your API

You can test your API endpoints using curl

### Public Routes (No Authentication)
```bash
# Get all artists (public route)
$ curl https://localhost:8080/artists

# Get all albums (this will fail - albums is protected)
$ curl https://localhost:8080/albums

# Create a new artist (public route)
$ curl -X POST https://localhost:8080/artists \
  -H "Content-Type: application/json" \
  -d '{"name": "Drake", "realName": "Aubrey Drake Graham", "dob": "24-10-1986"}'
```

### Protected Routes (With JWT Authentication)
```bash
# First, get a JWT token by logging in
$ curl -X POST https://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'

# Use the JWT token to access protected albums
$ curl -H "Authorization: Bearer YOUR_JWT_TOKEN" https://localhost:8080/albums

# Create a new album on protected route
$ curl -X POST https://localhost:8080/albums \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "Recovery", "releaseDate": "21-06-2010"}'
```

### Health Check Testing
```bash
# Test basic health endpoint
$ curl https://localhost:8080/health

# Test trusted endpoints (HTTPS only)
$ curl https://localhost:8080/api/trusted
$ curl https://localhost:8080/api/trusted-data
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

### Schema Validation

When schema validation is enabled, JSON Express will validate incoming POST and PATCH requests against your defined schema:

```bash
# This will succeed (matches schema)
$ curl -X POST https://localhost:8080/albums \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "Recovery", "releaseDate": "21-06-2010"}'

# This will fail (missing required field)
$ curl -X POST https://localhost:8080/albums \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "Recovery"}'
```

## 🛑 Stopping the Server

To stop the JSON Express server, use `Ctrl + C` in your terminal.

## 📄 License

[ISC License](LICENSE)

## 🐛 Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/vaz-matri/json-express/issues).
