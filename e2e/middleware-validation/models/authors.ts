import { defineModel, types } from '@json-express/core';
import { z } from 'zod';

export default defineModel({
    fields: {
        id: types.id(),
        name: types.string({ required: true }),
        email: types.string({ required: true }),
        country: types.string(),
        books: types.relation({ target: 'books', type: 'one-to-many', foreignKey: 'authorId' }),
    },
    validation: {
        create: {
            body: z.object({
                name: z.string().min(2),
                email: z.string().email(),
                country: z.string().length(2, 'Use a 2-letter country code').optional(),
            }),
        },
    },
});
