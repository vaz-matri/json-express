import { defineModel, types } from '@json-express/core';

export default defineModel({
    fields: {
        id: types.id(),
        name: types.string().required().minLength(1).maxLength(200),
        wizardId: types.string().required(),
        rarity: types.string({ default: 'common' }),
        potencyLevel: types.number().min(1).max(10),
        bottled: types.boolean().default(true),
        wizard: types.relation({ target: 'wizards', type: 'many-to-one', foreignKey: 'wizardId' })
    }
});
