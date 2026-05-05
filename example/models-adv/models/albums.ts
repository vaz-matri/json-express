import { defineModel, types } from '@json-express/core';

export default defineModel({
    fields: {
        id: types.id(),
        title: types.string({ required: true }),
        artistId: types.string({ required: true }),
        playCount: types.number({ default: 0 }),
        createdAt: types.date(),
        updatedAt: types.date(),
        artist: types.relation({ target: 'artists', type: 'many-to-one', foreignKey: 'artistId' })
    },

    hooks: {
        beforeCreate: (data) => {
            return { ...data, createdAt: new Date().toISOString(), playCount: data.playCount ?? 0 };
        },

        afterCreate: async (album, ctx) => {
            await ctx.db.create('audit-log', {
                collection: 'albums',
                action: 'create',
                recordId: album.id,
                at: new Date().toISOString()
            });
        },

        beforeUpdate: (patch) => {
            return { ...patch, updatedAt: new Date().toISOString() };
        },

        afterUpdate: async (album, _patch, ctx) => {
            await ctx.db.create('audit-log', {
                collection: 'albums',
                action: 'update',
                recordId: album.id,
                at: new Date().toISOString()
            });
        }
    },

    endpoints: {
        'POST /:id/play': async (req, res, ctx) => {
            const id = req.params.id;
            try {
                const album = await ctx.db.getById('albums', id);
                const next = (album.playCount ?? 0) + 1;
                const updated = await ctx.db.update('albums', id, { playCount: next });
                res.status(200).json(updated);
            } catch {
                res.status(404).json({ error: `Album '${id}' not found.` });
            }
        }
    }
});
