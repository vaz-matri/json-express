import { defineModel, types } from '@json-express/core';
import { z } from 'zod';

export default defineModel({
    fields: {
        id: types.id(),
        title: types.string({ required: true }),
        authorId: types.number({ required: true }),
        isbn: types.string({ required: true }),
        pages: types.number(),
        author: types.relation({ target: 'authors', type: 'many-to-one', foreignKey: 'authorId' }),
    },
    validation: {
        create: {
            body: z.object({
                title: z.string().min(1),
                authorId: z.number().int().positive(),
                isbn: z.string().regex(/^\d{3}-\d{10}$/, 'ISBN must look like 978-0135957059'),
                pages: z.number().int().positive().optional(),
            }),
        },
    },
    endpoints: {
        // Custom endpoint: object form `{ handler, validation }` lets the
        // validation middleware guard query/body for routes outside CRUD.
        'GET /search': {
            validation: {
                query: z.object({
                    q: z.string().min(2, 'Search term must be at least 2 characters'),
                    limit: z.coerce.number().int().min(1).max(50).default(10),
                }),
            },
            handler: async (req, res, ctx) => {
                const { q, limit } = req.query as { q: string; limit: number };
                const all = await ctx.db.list('books');
                const needle = q.toLowerCase();
                const hits = all
                    .filter((b: any) => String(b.title).toLowerCase().includes(needle))
                    .slice(0, limit);
                res.status(200).json({ q, count: hits.length, results: hits });
            },
        },
    },
});
