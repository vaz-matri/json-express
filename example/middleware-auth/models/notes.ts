import { defineModel, types } from '@json-express/core';

// Owner row-level security: each user only sees/touches their own notes.
// `adminNotes` is a field-level override — only admins can read or write it,
// even when the row itself is owned by the caller.
export default defineModel({
    fields: {
        id: types.id(),
        title: types.string({ required: true }),
        body: types.string(),
        ownerId: types.string(),
        adminNotes: types.string(),
    },
    access: {
        read: 'owner',
        create: 'owner',   // auto-stamps the caller as owner
        update: 'owner',
        delete: 'owner',
        fields: {
            adminNotes: { read: 'admin', create: 'admin', update: 'admin' },
        },
    },
});
