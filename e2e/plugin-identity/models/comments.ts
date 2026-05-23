import { defineModel, types } from '@json-express/core';

export default defineModel({
    name: 'comments',
    fields: {
        id: types.id(),
        articleId: types.string({ required: true }),
        body: types.string({ required: true }),
        authorId: types.string(),
        createdAt: types.date(),
    },
    access: {
        read: 'public',
        create: 'owner',     // auth required; auto-stamps the caller as `authorId`
        update: 'owner',
        delete: 'owner',
        ownerField: 'authorId',
    },
});
