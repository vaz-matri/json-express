import { defineModel, types } from '@json-express/core';

// Reviews are user-generated content. Owner row-level security keeps each
// reviewer's records private; the `moderatorNotes` field is admin-only,
// even for the owner — useful for content moderation workflows.
export default defineModel({
    fields: {
        id: types.id(),
        bookId: types.string({ required: true }),
        ownerId: types.string(),
        rating: types.number({ required: true, min: 1, max: 5 }),
        body: types.string(),
        moderatorNotes: types.string(),
        book: types.relation({ target: 'book', type: 'many-to-one', foreignKey: 'bookId' }),
    },
    access: {
        read: 'owner',
        create: 'owner',   // auto-stamps caller as owner
        update: 'owner',
        delete: 'owner',
        fields: {
            moderatorNotes: { read: 'admin', create: 'admin', update: 'admin' },
        },
    },
});
