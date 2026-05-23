import { defineModel, types } from '@json-express/core';
import { z } from 'zod';

export default defineModel({
    fields: {
        id: types.id(),
        title: types.string({ required: true }),
        location: types.string({ required: true }),
        startsAt: types.string({ required: true }),
        capacity: types.number({ required: true }),
    },
    validation: {
        // POST /events — full body required
        create: {
            body: z.object({
                title: z.string().min(3),
                location: z.string().min(1),
                startsAt: z.string().datetime({ message: 'startsAt must be an ISO 8601 datetime' }),
                capacity: z.number().int().min(1).max(10_000),
            }),
        },
        // PATCH /events/:id — partial body. Builder form: start from the auto-derived
        // baseline (already `.partial()`'d for updates) and tighten capacity.
        update: {
            body: (baseline) =>
                baseline.extend({
                    capacity: z.number().int().min(1).max(10_000).optional(),
                }),
        },
        // GET /events?... — query string filters
        list: {
            query: z.object({
                location: z.string().optional(),
                upcoming: z.enum(['true', 'false']).optional(),
                limit: z.coerce.number().int().min(1).max(100).optional(),
            }),
        },
    },
});
