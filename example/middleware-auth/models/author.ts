import { defineModel, types } from '@json-express/core';

// Authors write books. Anyone can browse, but only admins curate the catalog.
export default defineModel({
    fields: {
        id: types.id(),
        name: types.string({ required: true }),
        email: types.string(),
        bio: types.string(),
        country: types.string(),
        books: types.relation({ target: 'book', type: 'one-to-many', foreignKey: 'authorId' }),
    },
    access: {
        read: 'public',
        create: 'admin',
        update: 'admin',
        delete: 'admin',
    },
});
