import { defineModel, types } from '@json-express/core';

// Private todos. `read: 'owner'` means a user can ONLY see their own rows even
// from the list endpoint — the framework injects `ownerId = JWT.sub` into the
// query automatically, so two users hitting GET /tasks see disjoint lists.
export default defineModel({
    name: 'tasks',
    fields: {
        id: types.id(),
        title: types.string({ required: true }),
        status: types.string({ default: 'pending' }), // 'pending' | 'done'
        priority: types.number({ default: 3, min: 1, max: 5 }),
        ownerId: types.string(),
        createdAt: types.date(),
    },
    access: {
        read: 'owner',
        create: 'owner',
        update: 'owner',
        delete: 'owner',
        ownerField: 'ownerId',
    },
});
