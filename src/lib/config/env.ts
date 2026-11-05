import { z } from 'zod';

const schema = z.object({
  VITE_APP_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

export const env = schema.parse({
  VITE_APP_ENV:
    import.meta.env.VITE_APP_ENV ??
    (import.meta.env.PROD ? 'production' : 'development'),
});
