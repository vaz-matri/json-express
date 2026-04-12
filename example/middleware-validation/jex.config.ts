import { z } from 'zod';

export default () => ({
  validation: {
    rules: [
      {
        method: 'POST',
        path: '/products',
        body: z.object({
          name: z.string(),
          price: z.number(),
          inStock: z.boolean().default(true)
        })
      }
    ]
  }
});
