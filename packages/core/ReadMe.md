# JSON Express

A lightweight, fast JSON server for rapid API prototyping and development. Get a full REST API with zero coding in seconds.

## ✨ Features

- **Zero Configuration** - Just point to your JSON files and go
- **Full REST API** - GET, POST, PATCH, DELETE operations
- **Lightweight** - Minimal dependencies, maximum performance
- **CORS Enabled** - Coming soon


## 🚀 Quick Start

### Global Installation
```bash
npm install -g @json-express/core
```

### Usage
```bash
# Navigate to your project directory
$ cd my-project

# Create a sample JSON file (albums.json)
$ echo '[{"name": "Encore", "releaseDate": "12-11-2004"}]' > albums.json

# Start the server
$ json-server
```

### Local Installation (Project-specific)
```bash
# Navigate to your project directory
$ cd my-project

# Install locally in your project
$ npm install @json-express/core

# Create your JSON files
$ echo '[{"name": "Encore", "releaseDate": "12-11-2004"}]' > albums.json

# Start the server using npx
$ npx json-express
```

### Stopping the Server
To stop the JSON Express server, use:
- **Mac/Linux**: `Ctrl + C`
- **Windows**: `Ctrl + C`

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

## 📚 API Endpoints

Based on your JSON structure, JSON Express automatically creates RESTful endpoints:

```
GET    /albums         # Get all albums
GET    /albums/:id     # Get album with id
POST   /albums         # Create a new album
PATCH  /albums/:id     # Partially update album with id 
DELETE /albums/:id     # Delete album with id 
```

## 📁 Sample JSON Structure

Create as many JSON files with any number of fields as you like. ID will be added automatically!

Here's an `albums.json` file with some data:

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

And an `artists.json` file:

```json
[
  {
    "name": "Eminem",
    "realName": "Marshall Bruce Mathers III",
    "dob": "17-10-1972",
    "genre": "Hip Hop",
    "country": "United States",
    "debutYear": 1996,
    "isActive": true,
    "recordLabel": "Aftermath Entertainment",
    "website": "https://www.eminem.com"
  },
  {
    "name": "Taylor Swift",
    "realName": "Taylor Alison Swift",
    "dob": "13-12-1989",
    "genre": "Pop",
    "country": "United States",
    "debutYear": 2006,
    "isActive": true,
    "recordLabel": "Republic Records",
    "website": "https://www.taylorswift.com"
  },
]
```

## 📄 License

ISC License - see the [LICENSE](LICENSE) file for details.

## 🐛 Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/vaz-matri/json-express/issues).
