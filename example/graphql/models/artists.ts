import { defineModel, types } from '@json-express/core';

export default defineModel({
    fields: {
        id: types.id(),
        name: types.string({ required: true }),
        genre: types.string(),
    },
});
