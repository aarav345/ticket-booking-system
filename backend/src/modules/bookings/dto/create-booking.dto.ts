import { z } from 'zod';

export const CreateBookingSchema = z.object({
  concertId: z.string().min(1, 'Concert ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  tickets: z
    .array(
      z.object({
        tierId: z.string().min(1, 'Tier ID is required'),
        quantity: z.number().int().min(1).max(10, 'Max 10 tickets per tier'),
      })
    )
    .min(1, 'At least one ticket required')
    .max(3, 'Max 3 tiers per booking'),
  idempotencyKey: z.string().uuid('Invalid idempotency key'),
  totalAmount: z.number().positive('Total amount must be positive'),
});

export type CreateBookingDto = z.infer<typeof CreateBookingSchema>;
