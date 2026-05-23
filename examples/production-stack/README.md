# JSONExpress Production Stack Showcase

This showcase contains the *exact same model code* as the `local-stack` example. However, by simply swapping dependencies in `package.json` and editing the `.env` file, this app is now scaled to a robust, distributed environment.

## Architecture
- **Database**: `@json-express/adapter-postgres`
- **Queue**: `@json-express/queue-bullmq` (Redis)
- **KV Store**: `@json-express/kv-redis` (Redis)

## Running the App

1. **Start the Infrastructure**
```bash
docker-compose up -d
```

2. **Install and Migrate**
```bash
npm install
npm run migrate
```
*(The migration will automatically parse `models/products.ts` and generate the `CREATE TABLE products` schema in Postgres!)*

3. **Start the App**
```bash
npm run dev
```

## Testing the Capabilities

1. **Create a Product**
```bash
curl -X POST http://localhost:3000/api/products \
     -H "Content-Type: application/json" \
     -d '{"name": "Laptop", "price": 999, "stock": 10}'
```

2. **Buy the Product**
*(Replace `:id` with the UUIDv7 returned from step 1)*
```bash
curl -X POST http://localhost:3000/api/products/:id/buy \
     -H "Content-Type: application/json" \
     -d '{"email": "buyer@example.com", "quantity": 1}'
```

3. **Check the KV Rate Limiter**
Run the buy command 5 times rapidly. Redis will evict the keys based on the exact TTL specified in the endpoint, seamlessly scaling the rate limiter across any number of NodeJS processes!
