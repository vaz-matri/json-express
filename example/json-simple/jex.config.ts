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
    },
    faker: {
        count: 5,
        collections: {
            artists: () => ({
                id: Math.random().toString(36).substr(2, 9),
                name: 'The Fake Mockers',
                genre: 'Rock'
            })
        }
    },
    
    // Enable Automatic Local SSL Generation
    https: true
};
