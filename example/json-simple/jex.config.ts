import { z } from 'zod';

export default {
    validation: {
        rules: [
            {
                method: 'POST',
                path: '/api/v1/artists',
                body: z.object({
                    name: z.string({ required_error: 'Artist name is required' }),
                    genre: z.string().optional()
                })
            }
        ]
    }
};
