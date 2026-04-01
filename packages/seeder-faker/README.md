# @json-express/seeder-faker

The official Faker plugin for JSON Express. This package acts as an `ISeeder` lifecycle hook, giving you the ability to effortlessly inject realistic, structured mock data into your active database adapter upon server startup.

## Installation

```bash
pnpm add @json-express/seeder-faker
```

Simply installing this package automatically allows the JSON Express CLI auto-discovery engine to recognize and queue the seeder during the boot sequence.

## CLI Execution Flags

Because injecting dummy data into a production database can be dangerous, execution is safely controlled via explicit CLI arguments when running your server:

- `json-express --seed` **(Smart/Idempotent Mode)**: The seeder checks the active database collection first. If the collection contains data (>0 records), it safely skips the operation. It only generates mock data if the collection is perfectly empty.
- `json-express --seeder` **(Force/Aggressive Mode)**: Completely ignores the state of the existing database and forces the generation of new mock records every single time the command is called.

## Configuration

You can seamlessly define exactly how many records to generate, or even provide custom schema formats, utilizing your projects `jex.config.js` or `jex.config.ts` configuration file mapping to the `faker` key.

```typescript
import { z } from 'zod';
import { faker } from '@faker-js/faker';

export default {
    faker: {
        // Default number of records to generate if not specified below
        count: 10,
        
        collections: {
            // 1. Numeric Shorthand: Simply generates 25 default generic objects for '/users'
            users: 25,
            
            // 2. Custom Schema: Define exactly how the mock data should look
            artists: () => ({
                id: faker.string.uuid(),
                name: faker.person.fullName(),
                genre: faker.music.genre(),
                createdAt: faker.date.recent().toISOString()
            })
        }
    }
};
```

> **Note:** If you start your server using `--seed` in an empty directory without any `.json` files, JSON Express normally throws an error. However, if you configure your `collections` using this plugin, the framework intelligently recognizes those schemas and boots your server safely, meaning you can prototype APIs completely from scratch using 100% Mock Data!
