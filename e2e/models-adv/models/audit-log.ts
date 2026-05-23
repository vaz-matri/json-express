import { defineModel, types } from '@json-express/core';

export default defineModel({
    exposeApi: false,
    fields: {
        id: types.id(),
        collection: types.string({ required: true }),
        action: types.string({ required: true }),
        recordId: types.string({ required: true }),
        at: types.date()
    },
    endpoints: {
        'GET /list': async (_req, res, ctx) => {
            const rows = await ctx.db.getAll('audit-log');
            res.status(200).json(rows);
        }
    }
});
