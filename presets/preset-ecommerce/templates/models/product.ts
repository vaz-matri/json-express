import { defineModel, types } from '@json-express/core';

export default defineModel({
    name: 'product',
    fields: {
        name: types.string().required(),
        description: types.string(),
        price: types.number().required().default(0),
        stock: types.number().required().default(0),
        isActive: types.boolean().default(true)
    }
});
