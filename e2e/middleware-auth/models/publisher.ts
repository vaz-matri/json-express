import { defineModel, types } from '@json-express/core';

// Publishers help books reach print. Same access shape as authors —
// read is public, write is admin-only.
export default defineModel({
    fields: {
        id: types.id(),
        name: types.string({ required: true }),
        country: types.string(),
        foundedYear: types.number(),
        website: types.string(),
        books: types.relation({ target: 'book', type: 'one-to-many', foreignKey: 'publisherId' }),
    },
    access: {
        read: 'public',
        create: 'admin',
        update: 'admin',
        delete: 'admin',
    },
});
