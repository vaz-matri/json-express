import { defineModel, types } from '@json-express/core';

export default defineModel({
    name: 'order',
    fields: {
        productId: types.string().required(),
        quantity: types.number().required().default(1),
        totalPrice: types.number().required(),
        status: types.string().default('pending')
    }
});
