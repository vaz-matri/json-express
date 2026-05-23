import { defineModel } from '@json-express/core';

export default defineModel({
    exposeApi: false, // We don't want standard CRUD for this
    endpoints: {
        'POST /:key': async (req, res, ctx) => {
            const key = req.params.key;
            const value = req.body;
            
            if (ctx.kvStore) {
                await ctx.kvStore.set(key, value, { ttlMs: 1000 }); // 1 second TTL for test
                res.status(200).json({ success: true });
            } else {
                res.status(500).json({ error: 'No KV store registered' });
            }
        },
        'GET /:key': async (req, res, ctx) => {
            if (ctx.kvStore) {
                const val = await ctx.kvStore.get(req.params.key);
                if (val) {
                    res.status(200).json(val);
                } else {
                    res.status(404).json({ error: 'Key not found' });
                }
            }
        }
    }
});
