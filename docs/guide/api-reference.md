---
title: API Reference — Model Schema Builder
description: Comprehensive dictionary of all types.* methods and configuration options for defining JSONExpress schemas.
---

# API Reference

When ejecting from Zero-Config JSON Mode to TypeScript, you will use the `defineModel` builder. This reference exhaustively lists every available `types.*` method and its configuration options.

## Base Options
All `types.*` methods accept a generic `BaseOptions` object:

| Option | Type | Default | Description |
|---|---|---|---|
| `required` | `boolean` | `false` | If `true`, the API will return `400 Bad Request` if this field is missing during `POST`. |
| `default` | `any` | `undefined` | The default value assigned if the client does not provide one. |
| `unique` | `boolean` | `false` | If `true`, the database adapter will enforce uniqueness. Returns `409 Conflict` on duplicates. |
| `index` | `boolean` | `false` | Instructs the database adapter to build an index on this column for faster `?search=` queries. |
| `primaryKey` | `boolean` | `false` | Marks this field as the Primary Key. (You can also use `primaryKeys: ['id', 'orgId']` at the root model level). |

## Types Dictionary

### `types.string(options?)`
Defines a text field.

**Specific Options:**
*   `minLength` (`number`): Minimum string length.
*   `maxLength` (`number`): Maximum string length.

**Example:**
```typescript
username: types.string({ required: true, minLength: 3, unique: true })
```

---

### `types.number(options?)`
Defines a numeric field (integer or float).

**Specific Options:**
*   `min` (`number`): Minimum allowed value.
*   `max` (`number`): Maximum allowed value.

**Example:**
```typescript
price: types.number({ min: 0, default: 9.99 })
```

---

### `types.boolean(options?)`
Defines a true/false field.

**Example:**
```typescript
published: types.boolean({ default: false })
```

---

### `types.date(options?)`
Defines an ISO-8601 Date field.

**Example:**
```typescript
createdAt: types.date({ default: () => new Date().toISOString() })
```

---

### `types.id(options?)`
A specialized field type that automatically configures itself as the primary key. When using `@json-express/adapter-postgres`, this maps to a `UUID` or `SERIAL` column. When using `@json-express/adapter-mongodb`, this maps seamlessly to the internal BSON `_id` `ObjectId`.

**Example:**
```typescript
id: types.id()
```

---

### `types.relation(options)`
Defines a relational link between two collections. 

**Specific Options:**
*   `target` (`string`, **Required**): The name of the target collection (e.g., `'categories'`).
*   `type` (`'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'`, **Required**): The cardinality of the relationship.
*   `foreignKey` (`string`): The column name that holds the reference. If omitted, JSONExpress attempts to infer it (e.g., `categoryId`).
*   `onDelete` (`'CASCADE' | 'SET NULL' | 'RESTRICT'`): The database constraint behavior when the parent record is deleted.

**Example:**
```typescript
// Inside models/products.ts
categoryId: types.string({ required: true }),
category: types.relation({ 
    target: 'categories', 
    type: 'many-to-one', 
    foreignKey: 'categoryId',
    onDelete: 'CASCADE'
})
```

By defining relations, the API generator automatically enables the `?_expand=category` query parameter, allowing clients to fetch the product and its parent category in a single request.
