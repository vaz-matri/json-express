import { defineRoutes } from '@json-express/core';
import { z } from 'zod';

// A fieldless model: declares behavior only, no entity.
// `defineRoutes()` is sugar for `defineModel({ exposeApi: false, ... })`.
// Mounts as: GET /search?q=<term>
export default defineRoutes({
    endpoints: {
        'GET /': {
            handler: async (req, res, ctx) => {
                const q = String(req.query.q ?? '').toLowerCase();
                const products = await ctx.db.getAll<{ id: string; name: string; price: number }>('products');
                const matches = products.filter(p => p.name.toLowerCase().includes(q));
                res.status(200).json({ query: q, results: matches });
            },
            validation: {
                query: z.object({
                    q: z.string().min(2),
                }),
            },
        },
    },
});
