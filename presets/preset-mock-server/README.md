# @json-express/preset-mock-server

This preset bundles everything you need to start a powerful, self-seeding mock server in zero seconds. 

## Features
- **File Persistence:** Uses `@json-express/adapter-json` to atomically save API mutations back to your local `data/` folder.
- **Mock Data Generation:** Bundles `@json-express/seeder-faker` to instantly fill empty JSON arrays with hundreds of realistic records.
- **REST API:** Generates standard RESTful endpoints instantly via `@json-express/api-rest`.

## Quick Start
1. Install the preset:
   ```bash
   npm install @json-express/preset-mock-server
   ```
2. Create a `data/products.json` file.
3. Start the server!
   ```bash
   npx json-express
   ```
