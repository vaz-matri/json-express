import { defineModel, types } from '@json-express/core';

export default defineModel({
    name: 'order',
    fields: {
        productId: types.string({ required: true }),
        quantity: types.number({ required: true, default: 1 }),
        totalPrice: types.number({ required: true }),
        status: types.string({ default: 'pending' })
    }
});
