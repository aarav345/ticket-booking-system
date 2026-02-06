import { z } from 'zod';

export const BookingIdParamSchema = z.object({
  id: z
    .string()
    .min(1, 'Booking ID is required')
    .max(50, 'Booking ID must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Booking ID contains invalid characters'),
});

export type BookingIdParamDto = z.infer<typeof BookingIdParamSchema>;
