import { z } from 'zod';

export const ConcertIdParamSchema = z.object({
  id: z
    .string()
    .min(1, 'Concert ID is required')
    .max(50, 'Concert ID must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Concert ID contains invalid characters'),
});

export type ConcertIdParamDto = z.infer<typeof ConcertIdParamSchema>;
