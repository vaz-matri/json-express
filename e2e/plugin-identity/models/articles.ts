import { defineModel, types, evaluateAccess } from '@json-express/core';

export default defineModel({
    name: 'articles',
    fields: {
        id: types.id(),
        title: types.string({ required: true }),
        body: types.string({ required: true }),
        authorId: types.string(),
        featured: types.boolean({ default: false }),
        internalNotes: types.string(),
        createdAt: types.date(),
    },
    access: {
        read: 'public',
        create: 'owner',     // any authenticated caller; framework auto-stamps `authorId`
        update: 'owner',     // only the author edits
        delete: 'owner',     // only the author deletes
        ownerField: 'authorId',
        fields: {
            // Editorial review notes — readable & writable by admin only.
            // Regular users get the field silently stripped from responses and
            // from any body they submit.
            internalNotes: {
                read: 'admin',
                create: 'admin',
                update: 'admin',
            },
        },
    },
    endpoints: {
        // Role-gated custom endpoint: only admins can flip the featured flag,
        // and they can do it on any article (bypasses the model's owner rule
        // on purpose — that's the point of moderation).
        'POST /:id/feature': async (req, res, ctx) => {
            const verdict = evaluateAccess('admin', req.headers['x-user-payload']);
            if (!verdict.allowed) {
                return res.status(verdict.code === 'UNAUTHENTICATED' ? 401 : 403).json({ error: verdict.reason });
            }

            const id = req.params.id;
            try {
                const article = await ctx.db.getById('articles', id);
                if (!article) return res.status(404).json({ error: 'Article not found' });
                const updated = await ctx.db.update('articles', id, {
                    featured: !article.featured,
                });
                return res.status(200).json(updated);
            } catch {
                return res.status(404).json({ error: 'Article not found' });
            }
        },
    },
});
