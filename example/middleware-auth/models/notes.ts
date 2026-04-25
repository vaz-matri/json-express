import { defineModel, types } from '@json-express/core';

// Owner row-level security: each user only sees/touches their own notes.
export default defineModel({
    fields: {
        id: types.id(),
        title: types.string({ required: true }),
        body: types.string(),
        ownerId: types.string(),
    },
    access: {
        read: 'owner',
        create: 'owner',   // auto-stamps the caller as owner
        update: 'owner',
        delete: 'owner',
    },
});
