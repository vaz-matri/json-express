import { defineModel, types } from '@json-express/core';

export default defineModel({
    fields: {
        id: types.id(),
        title: types.string().required().minLength(1).maxLength(200),
        artistId: types.string().required(),
        releaseYear: types.number().min(1900).max(2100),
        explicit: types.boolean().default(false),
        artist: types.relation({ target: 'artists', type: 'many-to-one', foreignKey: 'artistId' })
    }
});
