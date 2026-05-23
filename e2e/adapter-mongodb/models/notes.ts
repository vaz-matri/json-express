import { defineModel, types } from '@json-express/core';

export default defineModel({
    fields: {
        id: types.id(),
        title: types.string({ required: true }),
        done: types.boolean({ default: false })
    }
});
