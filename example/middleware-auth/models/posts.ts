import { defineModel, types } from '@json-express/core';

export default defineModel({
    fields: {
        id: types.id(),
        title: types.string({ required: true }),
        body: types.string(),
    },
    access: {
        read: 'public',
        create: 'admin',
        update: ['admin', 'editor'],
        delete: 'admin',
    },
});
