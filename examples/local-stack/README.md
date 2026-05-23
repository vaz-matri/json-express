# JSONExpress Local Stack Showcase

A fully functional, complex e-commerce API demonstrating JSONExpress's ability to run entirely on zero-dependency, local infrastructure.

## Architecture
- **Database**: `@json-express/adapter-json` (Data is saved to a local JSON file)
- **Queue**: `@json-express/queue-memory` (Background jobs run in Node RAM)
- **KV Store**: `@json-express/kv-memory` (Rate limits are stored in Node RAM)

## Running the App

```bash
npm install
npm run dev
```

## Testing the Capabilities

This app exposes a custom endpoint on the `products` collection that utilizes the Database, the Queue, and the KV Store all at once.

1. **Create a Product**
```bash
curl -X POST http://localhost:3000/api/products \
     -H "Content-Type: application/json" \
     -d '{"name": "Laptop", "price": 999, "stock": 10}'
```

2. **Buy the Product (Triggers KV Rate Limit & Background Queue)**
*(Replace `:id` with the ID from step 1)*
```bash
curl -X POST http://localhost:3000/api/products/:id/buy \
     -H "Content-Type: application/json" \
     -d '{"email": "buyer@example.com", "quantity": 1}'
```

3. **Check Rate Limit**
Run the buy command 5 times rapidly. The KV Store will block the 6th attempt with a `429 Too Many Requests`.
