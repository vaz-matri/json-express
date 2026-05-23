import { defineModel, types } from '@json-express/core';

export default defineModel({
    fields: {
        id: types.id(),
        name: types.string({ required: true }),
        price: types.number({ required: true, min: 0 }),
        stock: types.number({ default: 0, min: 0 })
    },
    endpoints: {
        'POST /:id/buy': async (req, res, ctx) => {
            const id = req.params.id;
            const quantity = req.body.quantity || 1;
            const buyerEmail = req.body.email;

            if (!buyerEmail) return res.status(400).json({ error: 'Email required' });

            // 1. Check Rate Limit via KV Store
            if (ctx.kvStore) {
                const rateKey = `rate-limit:buy:${buyerEmail}`;
                const attempts = (await ctx.kvStore.get(rateKey)) || 0;
                if (attempts >= 5) {
                    return res.status(429).json({ error: 'Too many purchase attempts. Try again later.' });
                }
                await ctx.kvStore.set(rateKey, attempts + 1, { ttlMs: 60000 }); // 1 min lock
            }

            try {
                // 2. Read DB
                const product = await ctx.db.getById('products', id);
                if (product.stock < quantity) {
                    return res.status(400).json({ error: 'Insufficient stock' });
                }

                // 3. Mutate DB
                await ctx.db.update('products', id, { stock: product.stock - quantity });

                // 4. Enqueue Background Task (e.g. Email Receipt)
                if (ctx.queue) {
                    await ctx.queue.enqueue('emails', 'send-receipt', { 
                        email: buyerEmail, 
                        product: product.name, 
                        total: product.price * quantity 
                    });
                }

                res.status(200).json({ success: true, message: 'Purchase successful!' });
            } catch {
                res.status(404).json({ error: 'Product not found' });
            }
        }
    }
});
