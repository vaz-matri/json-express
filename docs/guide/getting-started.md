---
title: Getting Started with JSONExpress
description: Learn how to initialize a JSONExpress enterprise application, define your first schema, and auto-generate APIs.
---

# Getting Started

Welcome to JSONExpress!

JSONExpress is an enterprise-grade meta-framework that turns standard JSON files or TypeScript models into a robust, high-performance Headless CMS.

## Installation

```bash
npm install @json-express/core @json-express/cli
```

## First Schema

Create a `models/users.ts` file:

```typescript
import { defineModel, types } from '@json-express/core';

export default defineModel({
    name: 'users',
    fields: {
        id: types.id(),
        email: types.string({ unique: true }),
        password: types.string()
    }
});
```
