# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.7] - 2025-07-10

### Added
- JWT authentication support with passport and passport-jwt
- Login endpoint (`POST /login`) that accepts any username/password and returns JWT token
- JWT tokens are valid for one year
- Route-level authentication configuration via `config.json`
- Bearer token authentication for protected routes

### Changed
- Routes can now be configured as secure using `"auth": true` in route configuration
- Protected APIs now require Bearer token in Authorization header

### Dependencies
- Added `passport` for authentication middleware
- Added `passport-jwt` for JWT strategy
- Added `jsonwebtoken` for token generation and verification

## [0.1.6] - 2025-06-24

### Added
- Search API functionality
- Schema validation for search API using Joi
- CORS support for cross-origin requests
- Strict schema validation option via `"schema.validation": "strict"` in config.json

### Dependencies
- Added `cors` for handling cross-origin requests

## [0.1.5] - 2025-05-30

### Added
- Schema validation support using Joi (Work in Progress)

### Dependencies
- Added `joi` for data validation

## [0.1.4] - 2025-05-30

### Added
- Automatic port detection and fallback functionality
- Server now starts on next available port if specified port is busy

### Dependencies
- Added `get-port` for port availability checking

## [0.1.3] - 2025-05-30

### Added
- Configuration file support (`config.json`)
- Port number configuration through config file

### Changed
- Server port can now be configured via `config.json`

## [0.1.2] - 2025-05-24

### Added
- Initial CLI implementation for serving JSON files
- Basic HTTP server functionality

---

## Getting Started

### Optional Configuration (config.json)
```json
{
  "port": 8080,
  "schema.validation": "strict"
}
```

### Authentication Usage
1. Login to get JWT token:
   ```bash
   curl -X POST http://localhost:3000/login \
     -H "Content-Type: application/json" \
     -d '{"username": "any", "password": "any"}'
   ```

2. Use token for protected routes:
   ```bash
   curl -H "Authorization: Bearer <your-jwt-token>" \
     http://localhost:3000/protected-route
   ```

For detailed configuration options including route authentication and schema validation, see the [README](README.md) or [Documentation](docs/).
