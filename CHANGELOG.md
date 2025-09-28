# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.4] - wip

### Added
- `html-simple` example added

## [0.2.3] - wip

### Added
- DevelopmentGuide created
- `pnpm workspace` used to link packages


## [0.2.2] - 2025-07-28

### Updated
- ReadMe updated
  - Logo added
  - Organized topics
  - Examples updated

## [0.2.1] - 2025-07-18

### Fixed
- Server startup issue caused by Faker.js being incorrectly listed as a dev dependency

## [0.2.0] - 2025-07-16

### Added
- Session-based authentication support using express-session and passport-local
- User login with persistent session management
- Mock data generation using Faker.js - server can now run without JSON files
- New authentication endpoints:
    - `POST /login-session` - Session-based login (WIP)
    - `GET /profile` - User profile endpoint
- Automatic mock data generation when no JSON files are provided

### Changed
- Authentication system now supports both JWT tokens and session-based login
- Server can start without requiring JSON files thanks to Faker.js integration

### Dependencies
- Added `express-session` for session management
- Added `passport-local` for local authentication strategy
- Added `@faker-js/faker` for mock data generation

## [0.1.9] - 2025-07-12

### Added
- HTTPS protocol support with automatic certificate generation
- Protocol configuration via `"protocol": "https"` in config.json (defaults to "http")
- Automatic SSL certificate creation for secure API access
- Server health check endpoints:
    - `GET /health` (available for both HTTP and HTTPS)
    - `GET /api/trusted` (HTTPS only)
    - `GET /api/trusted-data` (HTTPS only, accepts any body)

### Changed
- First-time setup requires elevated permissions for certificate generation:
    - Windows: Run as Administrator
    - macOS: Enter user password when prompted
    - Linux: Run with sudo
- After initial certificate creation, server can run with normal permissions

### Dependencies
- Added `devcert` for SSL certificate management

## [0.1.8] - 2025-07-10

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
- Added `lodash.get` for token generation and verification

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
  "protocol": "https",
  "schema.validation": "strict"
}
```

### HTTPS Setup
When using HTTPS protocol for the first time, elevated permissions are required for certificate generation:
- **Windows**: Run as Administrator
- **macOS**: Enter user password when prompted
- **Linux**: Run with sudo

After initial setup, the server can run with normal permissions.

### Authentication Usage

#### JWT Authentication
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

#### Session-based Authentication
1. Login with session:
   ```bash
   curl -X POST http://localhost:3000/login-session \
     -H "Content-Type: application/json" \
     -d '{"username": "any", "password": "any"}' \
     -c cookies.txt
   ```

2. Access profile with session:
   ```bash
   curl -b cookies.txt http://localhost:3000/profile
   ```

### Health Check Endpoints
- `GET /health` - Basic health check (HTTP/HTTPS)
- `GET /api/trusted` - Trusted endpoint (HTTPS only)
- `GET /api/trusted-data` - Trusted data endpoint (HTTPS only, accepts any request body)

### Mock Data Generation
The server now includes Faker.js integration, allowing you to start a mock server without providing JSON files. The server will automatically generate realistic mock data for testing purposes.

For detailed configuration options including route authentication and schema validation, see the [README](README.md) or [Documentation](docs/).
