# JSON Express

A lightweight, fast JSON server for rapid API prototyping and development. Get a full REST API with zero coding in seconds.

**🌐 Homepage** [jsonexpress.com](https://jsonexpress.com)

## ✨ Features

- **Zero Configuration** - Just point to your JSON files and go
- **Full REST API** - GET, POST, PATCH, DELETE operations
- **Lightweight** - Minimal dependencies, maximum performance
- **CORS Enabled** - Coming soon

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
$ json-server
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

## 🧪 Testing Your API

You can test your API endpoints using curl

```bash
# Get all albums
$ curl http://localhost:3000/albums

# Get a specific album by ID
$ curl http://localhost:3000/albums/1

# Create a new album
$ curl -X POST http://localhost:3000/albums \
  -H "Content-Type: application/json" \
  -d '{"name": "Recovery", "releaseDate": "21-06-2010"}'

# Update an album
$ curl -X PATCH http://localhost:3000/albums/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Encore (Updated)"}'

# Delete an album
$ curl -X DELETE http://localhost:3000/albums/1
```

## ⚙️ Configuration

JSON Express favors convention over configuration, but when you need customization, simply create a `config.json` file in the same directory as your JSON data files.

### Creating a Configuration File

```bash
# Create config.json in your project directory
echo '{"PORT": "8080"}' > config.json
```

### Available Configuration Options

```json
{
  "PORT": 8080
}
```

**Note**: More configuration properties are coming soon!

### Example Project Structure
```
my-project/
├── config.json     # Optional configuration
├── albums.json     # Your data files
├── artists.json    # Your data files
└── ...
```

## 🛑 Stopping the Server

To stop the JSON Express server, use `Ctrl + C` in your terminal.

## 📄 License

ISC License

## 🐛 Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/vaz-matri/json-express/issues).
