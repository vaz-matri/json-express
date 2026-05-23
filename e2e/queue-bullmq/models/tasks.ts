import { defineModel, types } from '@json-express/core';

export default defineModel({
    fields: {
        id: types.id(),
        description: types.string({ required: true })
    },
    hooks: {
        afterCreate: async (task, ctx) => {
            if (ctx.queue) {
                // Enqueue a background job natively
                await ctx.queue.enqueue('test-queue', 'process-task', { taskId: task.id });
            }
        }
    }
});
