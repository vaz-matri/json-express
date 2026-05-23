import { defineModel, types } from '@json-express/core';

const TIERS = ['Gold', 'Platinum', 'Diamond'] as const;

export default defineModel({
    fields: {
        id: types.id(),
        name: types.string({ required: true }),
        artist: types.string(),
        releaseDate: types.string(),
        trackCount: types.number({ min: 1 }),
        genre: types.string(),
        certified: types.string()
    },

    endpoints: {
        // Promote an album's RIAA certification tier: Gold → Platinum → Diamond.
        'POST /:id/certify': async (req, res, ctx) => {
            const id = req.params.id;
            try {
                const album = await ctx.db.getById('albums', id);
                const idx = TIERS.indexOf(album.certified);
                if (idx === -1) {
                    res.status(400).json({ error: `Unknown certification tier: ${album.certified}` });
                    return;
                }
                if (idx === TIERS.length - 1) {
                    res.status(409).json({ error: `Album '${album.name}' is already at the top tier (${album.certified}).` });
                    return;
                }
                const next = TIERS[idx + 1];
                const updated = await ctx.db.update('albums', id, { certified: next });
                res.status(200).json(updated);
            } catch {
                res.status(404).json({ error: `Album '${id}' not found.` });
            }
        }
    }
});
