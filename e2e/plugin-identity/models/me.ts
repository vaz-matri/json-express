import { defineRoutes, evaluateAccess, resolveUserId } from '@json-express/core';

// Fieldless route module — the filename ('me') becomes the path prefix, so
// these mount as GET /me and GET /me/articles. Auth is enforced manually
// inside each handler since `access` on defineRoutes only governs the
// auto-generated CRUD that we explicitly opt out of here.
export default defineRoutes({
    endpoints: {
        'GET /': async (req, res, ctx) => {
            const verdict = evaluateAccess(['user', 'admin'], req.headers['x-user-payload']);
            if (!verdict.allowed) {
                return res.status(401).json({ error: verdict.reason });
            }
            const userId = resolveUserId(verdict.user);
            if (!userId) return res.status(401).json({ error: 'Token missing subject' });

            const user = await ctx.db.getById('users', userId);
            if (!user) return res.status(404).json({ error: 'User not found' });

            // Strip the password hash before returning. (The framework's field-level
            // strip on the `users` collection already hides it for non-admin reads,
            // but this endpoint reads via getById which bypasses that — so we strip
            // explicitly to make the example self-contained.)
            const { passwordHash, ...safe } = user;
            return res.status(200).json(safe);
        },

        'GET /articles': async (req, res, ctx) => {
            const verdict = evaluateAccess(['user', 'admin'], req.headers['x-user-payload']);
            if (!verdict.allowed) {
                return res.status(401).json({ error: verdict.reason });
            }
            const userId = resolveUserId(verdict.user);
            if (!userId) return res.status(401).json({ error: 'Token missing subject' });

            const all = await ctx.db.getAll('articles');
            const mine = all.filter((a: any) => String(a.authorId) === userId);
            return res.status(200).json(mine);
        },
    },
});
