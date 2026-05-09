import { defineModel, types } from '@json-express/core';

// Shared catalog of task tags. Anyone can read; only the auto-seeded admin can
// write. Demonstrates role-gated CRUD where the role check happens at the
// model level (not in a custom endpoint).
export default defineModel({
    name: 'tags',
    fields: {
        id: types.id(),
        name: types.string({ unique: true, required: true }),
        color: types.string(),
    },
    access: {
        read: 'public',
        create: 'admin',
        update: 'admin',
        delete: 'admin',
    },
});
