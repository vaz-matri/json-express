import { defineRoutes, evaluateAccess, resolveUserId } from '@json-express/core';

// Fieldless route module — the filename ('me') becomes the path prefix, so
// these mount as GET /me and GET /me/stats. Auth is enforced manually inside
// each handler since `defineRoutes` opts out of the auto-generated CRUD that
// `access:` normally governs.
export default defineRoutes({
    endpoints: {
        'GET /': async (req, res, ctx) => {
            const verdict = evaluateAccess(['user', 'admin'], req.headers['x-user-payload']);
            if (!verdict.allowed) return res.status(401).json({ error: verdict.reason });

            const userId = resolveUserId(verdict.user);
            if (!userId) return res.status(401).json({ error: 'Token missing subject' });

            const user = await ctx.db.getById('users', userId);
            if (!user) return res.status(404).json({ error: 'User not found' });

            const { passwordHash, tokenVersion, ...safe } = user;
            return res.status(200).json(safe);
        },

        'GET /stats': async (req, res, ctx) => {
            const verdict = evaluateAccess(['user', 'admin'], req.headers['x-user-payload']);
            if (!verdict.allowed) return res.status(401).json({ error: verdict.reason });

            const userId = resolveUserId(verdict.user);
            if (!userId) return res.status(401).json({ error: 'Token missing subject' });

            const all = await ctx.db.getAll('tasks');
            const mine = all.filter((t: any) => String(t.ownerId) === userId);
            const done = mine.filter((t: any) => t.status === 'done').length;
            return res.status(200).json({
                total: mine.length,
                done,
                pending: mine.length - done,
            });
        },
    },
});
