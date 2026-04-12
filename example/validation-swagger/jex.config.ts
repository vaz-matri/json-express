import { z } from 'zod';

export default () => ({
  validation: {
    rules: [
      {
        method: 'POST',
        path: '/users',
        body: z.object({
          username: z.string(),
          age: z.number(),
          isActive: z.boolean().default(true)
        })
      }
    ]
  }
});
