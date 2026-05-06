import { defineModel, types } from '@json-express/core';

export default defineModel({
    fields: {
        id: types.id(),
        name: types.string({ required: true, minLength: 1, maxLength: 200, unique: true }),
        school: types.string({ default: 'Unaffiliated' }),
        level: types.number({ min: 1, max: 100 }),
        active: types.boolean({ default: true }),
        ascendedAt: types.date(),
        potions: types.relation({ target: 'potions', type: 'one-to-many', foreignKey: 'wizardId' })
    }
});
