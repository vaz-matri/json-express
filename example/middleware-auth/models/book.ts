import { defineModel, types } from '@json-express/core';

// A book is written by exactly one author and released by exactly one publisher.
// Editors share write rights with admins to demonstrate role-array access.
export default defineModel({
    fields: {
        id: types.id(),
        title: types.string({ required: true }),
        isbn: types.string(),
        pages: types.number(),
        publishedYear: types.number(),
        authorId: types.string({ required: true }),
        publisherId: types.string({ required: true }),
        author: types.relation({ target: 'author', type: 'many-to-one', foreignKey: 'authorId' }),
        publisher: types.relation({ target: 'publisher', type: 'many-to-one', foreignKey: 'publisherId' }),
    },
    access: {
        read: 'public',
        create: 'admin',
        update: ['admin', 'editor'],
        delete: 'admin',
    },
});
