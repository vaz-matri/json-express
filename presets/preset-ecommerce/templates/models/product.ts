import { defineModel, types } from '@json-express/core';

export default defineModel({
    name: 'product',
    fields: {
        name: types.string().required(),
        description: types.string(),
        price: types.number().required().default(0),
        stock: types.number().default(100),
        isActive: types.boolean().default(true)
    }
});
