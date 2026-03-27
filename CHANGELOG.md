# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.5] - wip

### Added
- **Test Suite**: Added comprehensive unit and integration tests

## [0.2.5] - 2025-10-30

### Fixed
- **License**: Resolved mismatch in license documentation.

## [0.2.4] - 2025-10-21

### Added
- **Examples**: Added `html-simple`, `json-simple`, and `json-config` to demonstrate different use cases.

### Fixed
- **File System**: Improved directory reading logic for more reliable file discovery.

## [0.2.3] - 2025-10-01

### Added
- **Documentation**: Created `DevelopmentGuide.md` for project contributors.
- **Workflow**: Migrated to `pnpm workspace` for improved package linking and monorepo management.

## [0.2.2] - 2025-07-28

### Changed
- **Documentation**: Major update to `README.md` including a new logo, organized topics, and refreshed examples.

## [0.2.1] - 2025-07-18

### Fixed
- **Dependencies**: Fixed a server startup crash caused by `Faker.js` being incorrectly listed as a dev dependency.

## [0.2.0] - 2025-07-16

### Added
- **Session Auth**: Added support for session-based authentication using `express-session` and `passport-local`.
- **Mock Data**: Integrated `Faker.js` for automatic data generation, allowing the server to run without source JSON files.
- **User Endpoints**: Introduced `POST /login-session` and `GET /profile` for persistent session management.

### Changed
- **Auth Strategy**: Updated the system to support both JWT tokens and session-based login simultaneously.
- **Server Startup**: Enabled automatic fallback to mock data when no local JSON files are provided.

## [0.1.9] - 2025-07-12

### Added
- **HTTPS Support**: Implemented automatic SSL certificate generation via `devcert` for secure local API access.
- **Protocol Config**: Added protocol selection (`http` vs `https`) via `config.json`.
- **Health Checks**: Added status endpoints at `/health`, `/api/trusted`, and `/api/trusted-data`.

### Changed
- **Permissions**: Updated setup process to require elevated permissions (sudo/admin) only during the initial certificate generation.

## [0.1.8] - 2025-07-10

### Added
- **JWT Auth**: Integrated `passport-jwt` and `jsonwebtoken` for secure, token-based authentication.
- **Login API**: Added `POST /login` endpoint to generate and return JWT tokens (valid for one year).
- **Route Protection**: Added support for `"auth": true` in `config.json` to secure specific routes with Bearer tokens.

## [0.1.6] - 2025-06-24

### Added
- **Search API**: Implemented a search endpoint with built-in schema validation.
- **CORS Support**: Integrated `cors` middleware to allow cross-origin requests.
- **Strict Validation**: Added a `"schema.validation": "strict"` option in `config.json`.

## [0.1.5] - 2025-05-30

### Added
- **Schema Validation**: Introduced `Joi` for initial data validation support (Work in Progress).

## [0.1.4] - 2025-05-30

### Added
- **Port Management**: Integrated `get-port` for automatic detection and fallback if the default port is busy.

## [0.1.3] - 2025-05-30

### Added
- **Configuration**: Introduced `config.json` support for persistent port and server settings.

## [0.1.2] - 2025-05-24

### Added
- **Initial Release**: Basic CLI implementation and HTTP server functionality for serving JSON files.

---

## Getting Started

### Optional Configuration (config.json)
```json
{
  "port": 8080,
  "protocol": "https",
  "schema.validation": "strict"
}
