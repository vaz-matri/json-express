import { defineModel, types } from '@json-express/core';

export default defineModel({
    fields: {
        id: types.id(),
        title: types.string({ required: true }),
        artistId: types.string({ required: true }),
        artist: types.relation({ target: 'artists', type: 'many-to-one' })
    }
});
