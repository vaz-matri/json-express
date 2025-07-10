# JSON Express

A lightweight, fast JSON server for rapid API prototyping and development. Get a full REST API with zero coding in seconds.

**🌐 Homepage** [jsonexpress.com](https://jsonexpress.com)

## ✨ Features

- **Zero Configuration** - Just point to your JSON files and go
- **Full REST API** - GET, POST, PATCH, DELETE operations
- **Authentication Support** - Secure specific routes with built-in auth
- **Lightweight** - Minimal dependencies, maximum performance
- **CORS Enabled** - Cross-origin requests supported out of the box

## 📦 Installation

### Global Installation
```bash
npm install -g @json-express/core
```

### Local Installation (Project-specific)
```bash
# Navigate to your project directory
$ cd my-project

# Install locally in your project
$ npm install @json-express/core
```

## 📁 Setup Your JSON Files

Navigate to your project directory. If you already have JSON files, you can use those directly, or create your own

Here are some examples

```bash
# Navigate to your project directory
$ cd my-project

# Create an albums.json file
$ echo '[{"name": "Encore", "releaseDate": "12-11-2004"}, {"name": "The Marshall Mathers LP", "releaseDate": "23-05-2000"}]' > albums.json

# Create an artists.json file
$ echo '[{"name": "Eminem", "realName": "Marshall Bruce Mathers III", "dob": "17-10-1972", "genre": "Hip Hop", "country": "United States", "debutYear": 1996}, {"name": "Taylor Swift", "realName": "Taylor Alison Swift", "dob": "13-12-1989", "genre": "Pop", "country": "United States", "debutYear": 2006}]' > artists.json
```

ID will be added automatically!

## 🚀 Running the Server

### If you installed globally
```bash
$ json-express
```

### If you installed locally
```bash
$ npx json-express
```

## 📚 API Endpoints

Based on your JSON structure, JSON Express automatically creates RESTful endpoints:

```
GET    /albums         # Get all albums
GET    /albums/:id     # Get album with id
POST   /albums         # Create a new album
PATCH  /albums/:id     # Partially update album with id 
DELETE /albums/:id     # Delete album with id 
```

## 🔐 Authentication

JSON Express supports JWT-based route-level authentication. You can secure specific routes by configuring them in your `config.json` file.

### Setting Up Authenticated Routes

Create or update your `config.json` file to include route-specific authentication:

```json
{
  "PORT": 8080,
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
# Login with any username and password to get JWT token
$ curl -X POST http://localhost:8080/login \
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
$ curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8080/albums

# Example: Create a new album on protected route
$ curl -X POST http://localhost:8080/albums \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "Recovery", "releaseDate": "21-06-2010"}'

# Example: Access public artists endpoint (no token required)
$ curl http://localhost:8080/artists
```

**Note**: Replace `YOUR_JWT_TOKEN` with the actual JWT token received from the login endpoint.

## 🧪 Testing Your API

You can test your API endpoints using curl

### Public Routes (No Authentication)
```bash
# Get all artists (public route)
$ curl http://localhost:8080/artists

# Get all albums (this will fail - albums is protected)
$ curl http://localhost:8080/albums

# Create a new artist (public route)
$ curl -X POST http://localhost:8080/artists \
  -H "Content-Type: application/json" \
  -d '{"name": "Drake", "realName": "Aubrey Drake Graham", "dob": "24-10-1986"}'
```

### Protected Routes (With JWT Authentication)
```bash
# First, get a JWT token by logging in
$ curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'

# Use the JWT token to access protected albums
$ curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8080/albums

# Create a new album on protected route
$ curl -X POST http://localhost:8080/albums \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "Recovery", "releaseDate": "21-06-2010"}'
```

## ⚙️ Configuration

JSON Express favors convention over configuration, but when you need customization, simply create a `config.json` file in the same directory as your JSON data files.

### Creating a Configuration File

```bash
# Create config.json in your project directory
echo '{"PORT": 8080}' > config.json
```

### Available Configuration Options

```json
{
  "PORT": 8080,
  "routes": {
    "<route_name>": {
      "auth": true
    }
  }
}
```

### Configuration Properties

- **PORT** - Server port (default: 3000)
- **routes** - Route-specific configurations
    - **auth** - Enable authentication for specific routes (default: false)

**Note**: More configuration properties are coming soon!

### Example Project Structure
```
my-project/
├── config.json     # Optional configuration
├── albums.json     # Your data files
├── artists.json    # Your data files
└── ...
```

### Example Configuration with Mixed Authentication

```json
{
  "PORT": 8080,
  "routes": {
    "albums": {
      "auth": true
    }
  }
}
```

In this example, the `/albums` endpoints require authentication, while `/artists` endpoints remain public (no configuration needed for public routes).

## 🛑 Stopping the Server

To stop the JSON Express server, use `Ctrl + C` in your terminal.

## 📄 License

ISC License

## 🐛 Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/vaz-matri/json-express/issues).
