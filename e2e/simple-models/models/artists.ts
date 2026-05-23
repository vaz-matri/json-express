import { defineModel, types } from '@json-express/core';

export default defineModel({
    fields: {
        id: types.id(),
        name: types.string({ required: true, minLength: 1, maxLength: 200, unique: true }),
        genre: types.string({ default: 'Unspecified' }),
        active: types.boolean({ default: true }),
        foundedYear: types.number({ min: 1900, max: 2100 }),
        signedAt: types.date(),
        albums: types.relation({ target: 'albums', type: 'one-to-many', foreignKey: 'artistId' })
    }
});
