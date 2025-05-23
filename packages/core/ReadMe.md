# JSON Express

A lightweight, fast JSON server for rapid API prototyping and development. Get a full REST API with zero coding in seconds.

## ✨ Features

- **Zero Configuration** - Just point to your JSON files and go
- **Full REST API** - GET, POST, PATCH, DELETE operations
- **Lightweight** - Minimal dependencies, maximum performance
- **CORS Enabled** - Upcoming

## 🚀 Quick Start

### Global Installation
```bash
npm install -g @json-express/core
```

### Usage
```bash
# Navigate to your project directory
cd my-project

# Create a sample JSON file (albums.json)
echo '[   { "name": "Encore", "releaseDate": "12-11-2004" } ]' > albums.json

# Start the server
json-server
```

Your API is now running at `http://localhost:3000`

## 📚 API Endpoints

Based on your JSON structure, JSON Express automatically creates RESTful endpoints:

```
GET    /albums         # Get all albums
GET    /albums/<id>    # Get album with id
POST   /albums         # Create a new album
PATCH  /albums/<id>    # Partially update album with id 
DELETE /albums/<id>    # Delete album with id 
```

## 📁 Sample JSON Structure

Create as many JSON files as you like! Here's an `albums.json` file with some data:

```json
[
  {
    "name": "Encore",
    "releaseDate": "12-11-2004"
  },
  {
    "name": "The Marshall Mathers LP",
    "releaseDate": "23-05-2000"
  },
  {
    "name": "The Slim Shady LP",
    "releaseDate": "23-02-1999"
  }
]
```

## 📄 License

ISC License - see the [LICENSE](LICENSE) file for details.

## 🐛 Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/vaz-matri/json-express/issues).
