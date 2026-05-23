import { defineModel, types } from '@json-express/core';
import { z } from 'zod';

export default defineModel({
    fields: {
        id: types.id(),
        name: types.string({ required: true }),
        price: types.number({ required: true }),
        inStock: types.boolean(),
    },
    validation: {
        // Override the auto-derived baseline for create — adds a default for `inStock`
        // (Zod's `.default()` runs during safeParse, so the parsed body carries `true`
        // when the client omits the field).
        create: {
            body: z.object({
                name: z.string(),
                price: z.number(),
                inStock: z.boolean().default(true),
            }),
        },
    },
});
