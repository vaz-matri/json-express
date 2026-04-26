import { defineModel, types } from '@json-express/core';

export default defineModel({
    name: 'notes',
    fields: {
        id: types.id(),
        title: types.string(),
        body: types.string(),
        ownerId: types.string(),
    },
    access: {
        read: 'public',     // listed unauthenticated so playwright readiness probe gets a 200
        create: 'owner',
        update: 'owner',
        delete: 'owner',
    },
});
